# Magpie · Schema

The source of truth for the schema is `supabase/migrations/0001_init.sql`. This document explains the rationale.

## Tables overview

| Table | Purpose |
|---|---|
| `subjects` | User's personal subjects (History, Music...). Containers for topics. |
| `topics` | The conversation prompts. The entity users riff on. |
| `facets` | Cross-cutting tags per user (paradox, fun facts...). Many-to-many with topics. |
| `topic_facets` | Join table between topics and facets. |
| `thoughts` | Captured bullets inside a topic. User's own words. |
| `conversations` | Chat histories with the persona, one row per topic with a JSONB messages array. |
| `discover_items` | AI-suggested topics queued for review. |
| `ai_cache` | Cached Brief and Challenge responses per topic. Cleared on Reroll. |
| `user_settings` | Per-user preferences: persona name, AI toggle, default mode. |

## Tables in detail

### `subjects`

```sql
create table subjects (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete cascade not null,
 name text not null,
 position integer not null default 0,
 created_at timestamptz default now()
);
create index subjects_user_id_idx on subjects(user_id);
```

Each user owns their subjects. `position` is for ordering in the home grid. No `unique(user_id, name)` constraint because users might intentionally create duplicates (rare but allowed).

### `topics`

```sql
create table topics (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete cascade not null,
 subject_id uuid references subjects(id) on delete cascade not null,
 title text not null,
 position integer not null default 0,
 created_at timestamptz default now()
);
create index topics_user_id_idx on topics(user_id);
create index topics_subject_id_idx on topics(subject_id);
```

`user_id` is denormalized from `subjects.user_id` for simpler RLS policies and faster queries. Trigger keeps them in sync if we ever care (we probably don't).

### `facets`

```sql
create table facets (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete cascade not null,
 name text not null,
 created_at timestamptz default now(),
 unique(user_id, name)
);
create index facets_user_id_idx on facets(user_id);
```

Facets are per-user (Chris's "paradox" is not Sarah's "paradox"). The unique constraint prevents accidental duplicates per user. Lookups by name happen during topic creation when we want to find-or-create a facet.

### `topic_facets`

```sql
create table topic_facets (
 topic_id uuid references topics(id) on delete cascade not null,
 facet_id uuid references facets(id) on delete cascade not null,
 primary key (topic_id, facet_id)
);
create index topic_facets_facet_id_idx on topic_facets(facet_id);
```

Classic many-to-many join. The primary key gives us a unique constraint for free.

### `thoughts`

```sql
create table thoughts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete cascade not null,
 topic_id uuid references topics(id) on delete cascade not null,
 content text not null,
 position integer not null default 0,
 created_at timestamptz default now()
);
create index thoughts_topic_id_idx on thoughts(topic_id);
create index thoughts_user_id_idx on thoughts(user_id);
```

Each bullet is one row. Ordering via `position`. The original idea of using a JSONB array on topics was rejected because (a) we want to query thoughts independently for the Journal view, (b) Supabase realtime works better with row-level changes, (c) reordering and editing single thoughts is cleaner.

### `conversations`

```sql
create table conversations (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete cascade not null,
 topic_id uuid references topics(id) on delete cascade not null,
 messages jsonb not null default '[]'::jsonb,
 created_at timestamptz default now(),
 updated_at timestamptz default now(),
 unique(user_id, topic_id)
);
```

One conversation per (user, topic) pair. Messages stored as JSONB array of `{role, content}`. JSONB chosen over normalized rows because we always read the whole thread and append at the end. If we add features like editing individual messages or reactions, revisit.

### `discover_items`

```sql
create table discover_items (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete cascade not null,
 title text not null,
 source text,
 status text default 'pending' check (status in ('pending', 'accepted', 'skipped')),
 created_at timestamptz default now()
);
create index discover_items_user_id_idx on discover_items(user_id, status);
```

`source` is human-readable: "Maggie's notes on Foundation," "Asked Magpie for ideas," etc. Status drives the queue view (only `pending` shows).

### `ai_cache`

```sql
create table ai_cache (
 topic_id uuid references topics(id) on delete cascade not null,
 user_id uuid references auth.users(id) on delete cascade not null,
 mode text not null check (mode in ('brief', 'challenge', 'related', 'questions')),
 content text not null,
 created_at timestamptz default now(),
 primary key (topic_id, mode)
);
```

Cache key is (topic_id, mode). Reroll DELETEs the row and re-INSERTs. We could expire entries with a TTL but for now they live forever or until manual invalidation.

`related` is cached too because it's expensive enough to be worth caching, and the suggestions are fine even if a few weeks old.

### `user_settings`

```sql
create table user_settings (
 user_id uuid references auth.users(id) on delete cascade primary key,
 persona_name text not null default 'Maggie',
 ai_suggestions boolean not null default true,
 default_mode text not null default 'persona' check (default_mode in ('persona', 'brief', 'challenge', 'questions', 'convo')),
 created_at timestamptz default now(),
 updated_at timestamptz default now()
);
```

One row per user. Created on first login (via trigger or explicit insert in the post-signup flow).

`default_mode = 'persona'` means "the persona-named tab," not literally a tab called "persona." When rendering tabs, the first tab uses `user_settings.persona_name` as its label.

## RLS policies

Every table has RLS enabled with policies tied to `auth.uid()`. The pattern is uniform:

```sql
alter table subjects enable row level security;

create policy "Users see own subjects"
 on subjects for select
 using (auth.uid() = user_id);

create policy "Users insert own subjects"
 on subjects for insert
 with check (auth.uid() = user_id);

create policy "Users update own subjects"
 on subjects for update
 using (auth.uid() = user_id);

create policy "Users delete own subjects"
 on subjects for delete
 using (auth.uid() = user_id);
```

Apply the same four-policy pattern to every table. For the `topic_facets` join table, derive ownership through the topic:

```sql
create policy "Users see own topic_facets"
 on topic_facets for select
 using (exists (
 select 1 from topics where topics.id = topic_facets.topic_id and topics.user_id = auth.uid()
 ));
```

## Onboarding trigger

Create a Supabase trigger that fires on `auth.users` insert. It creates a default `user_settings` row and (optionally) seeds the user with starter content from `lib/seed/starter-topics.ts`.

```sql
create or replace function handle_new_user()
returns trigger as $$
begin
 insert into user_settings (user_id) values (new.id);
 return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
 after insert on auth.users
 for each row execute function handle_new_user();
```

The starter pack seed is intentionally done from the app server (Server Action on first sign-in) rather than from this trigger, because:
- The seed content is in TypeScript, not SQL
- We want to A/B test starter packs later
- The user might want a "skip starter" option during onboarding

## Indexes summary

- `subjects.user_id`: listing a user's subjects
- `topics.user_id`: flat topic list
- `topics.subject_id`: drilling into a subject
- `facets.user_id`: listing facets in the Facets tab
- `topic_facets.facet_id`: finding all topics for a facet (the cross-subject lens)
- `thoughts.topic_id`: loading a topic's bullets
- `thoughts.user_id`: building the Journal view
- `discover_items.(user_id, status)`: filtering the queue

## Query patterns

These are the queries `lib/queries/*` should expose. Use them as the contract:

```ts
// lib/queries/subjects.ts
getSubjectsWithCounts(): Promise<SubjectWithCount[]>
createSubject(name: string): Promise<Subject>
updateSubjectName(id: string, name: string): Promise<void>
deleteSubject(id: string): Promise<void>
reorderSubjects(orderedIds: string[]): Promise<void>

// lib/queries/topics.ts
getTopicsBySubject(subjectId: string): Promise<TopicWithFacets[]>
getTopicsByFacet(facetId: string): Promise<TopicWithSubjectAndFacets[]>
getAllTopics(): Promise<TopicWithSubjectAndFacets[]>
getTopic(id: string): Promise<TopicFull | null>
createTopic(input: CreateTopicInput): Promise<Topic>
updateTopicTitle(id: string, title: string): Promise<void>
deleteTopic(id: string): Promise<void>
spinRandomTopic(): Promise<Topic | null>

// lib/queries/facets.ts
getFacetsWithCounts(): Promise<FacetWithCount[]>
getFacetsForSubject(subjectId: string): Promise<FacetWithCount[]>
findOrCreateFacet(name: string): Promise<Facet>
setTopicFacets(topicId: string, facetIds: string[]): Promise<void>

// lib/queries/thoughts.ts
getThoughtsForTopic(topicId: string): Promise<Thought[]>
getAllThoughtsGrouped(): Promise<TopicWithThoughts[]>
createThought(topicId: string, content: string): Promise<Thought>
updateThought(id: string, content: string): Promise<void>
deleteThought(id: string): Promise<void>

// lib/queries/conversations.ts
getConversation(topicId: string): Promise<Conversation | null>
appendMessage(topicId: string, role: 'user'|'assistant', content: string): Promise<void>

// lib/queries/discover.ts
getPendingDiscover(): Promise<DiscoverItem[]>
addDiscoverItems(items: { title: string; source: string }[]): Promise<void>
acceptDiscoverItem(id: string, subjectId: string): Promise<Topic>
skipDiscoverItem(id: string): Promise<void>

// lib/queries/ai-cache.ts
getCached(topicId: string, mode: 'brief'|'challenge'|'related'): Promise<string | null>
setCached(topicId: string, mode: string, content: string): Promise<void>
clearCached(topicId: string, mode: string): Promise<void>

// lib/queries/settings.ts
getSettings(): Promise<UserSettings>
updateSettings(patch: Partial<UserSettings>): Promise<UserSettings>
```

Generate TypeScript types from the schema using:
```powershell
npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts
```
