-- Magpie initial schema
-- Apply via Supabase SQL editor or `supabase db push`
-- See docs/SCHEMA.md for rationale

-- ============================================
-- TABLES
-- ============================================

create table subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  position integer not null default 0,
  created_at timestamptz default now()
);
create index subjects_user_id_idx on subjects(user_id);

create table topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subject_id uuid references subjects(id) on delete cascade not null,
  title text not null,
  position integer not null default 0,
  -- Dormant in v1, ready for Phase 4.5 (Topic Groups / Option 2).
  -- A group is a topic with is_group=true and no thoughts of its own; it anchors
  -- a collection of sub-topics via parent_topic_id. Backward-compatible defaults
  -- mean every existing topic behaves identically until the group feature ships.
  -- See docs/MEMORY.md for the cross-context model that builds on this.
  is_group boolean not null default false,
  parent_topic_id uuid references topics(id) on delete cascade,
  created_at timestamptz default now()
);
create index topics_user_id_idx on topics(user_id);
create index topics_subject_id_idx on topics(subject_id);
create index topics_parent_id_idx on topics(parent_topic_id) where parent_topic_id is not null;

create table facets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now(),
  unique(user_id, name)
);
create index facets_user_id_idx on facets(user_id);

create table topic_facets (
  topic_id uuid references topics(id) on delete cascade not null,
  facet_id uuid references facets(id) on delete cascade not null,
  primary key (topic_id, facet_id)
);
create index topic_facets_facet_id_idx on topic_facets(facet_id);

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

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  topic_id uuid references topics(id) on delete cascade not null,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, topic_id)
);
create index conversations_topic_id_idx on conversations(topic_id);

create table discover_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  source text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'skipped')),
  created_at timestamptz default now()
);
create index discover_items_user_id_idx on discover_items(user_id, status);

create table ai_cache (
  topic_id uuid references topics(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  mode text not null check (mode in ('brief', 'challenge', 'related', 'questions')),
  content text not null,
  created_at timestamptz default now(),
  primary key (topic_id, mode)
);
create index ai_cache_user_id_idx on ai_cache(user_id);

create table user_settings (
  user_id uuid references auth.users(id) on delete cascade primary key,
  persona_name text not null default 'Maggie',
  ai_suggestions boolean not null default true,
  default_mode text not null default 'persona' check (default_mode in ('persona', 'brief', 'challenge', 'questions', 'convo')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- RLS: enable on all tables
-- ============================================

alter table subjects enable row level security;
alter table topics enable row level security;
alter table facets enable row level security;
alter table topic_facets enable row level security;
alter table thoughts enable row level security;
alter table conversations enable row level security;
alter table discover_items enable row level security;
alter table ai_cache enable row level security;
alter table user_settings enable row level security;

-- ============================================
-- POLICIES: simple owner-only on user_id tables
-- ============================================

-- subjects
create policy "Own subjects: select" on subjects for select using (auth.uid() = user_id);
create policy "Own subjects: insert" on subjects for insert with check (auth.uid() = user_id);
create policy "Own subjects: update" on subjects for update using (auth.uid() = user_id);
create policy "Own subjects: delete" on subjects for delete using (auth.uid() = user_id);

-- topics
create policy "Own topics: select" on topics for select using (auth.uid() = user_id);
create policy "Own topics: insert" on topics for insert with check (auth.uid() = user_id);
create policy "Own topics: update" on topics for update using (auth.uid() = user_id);
create policy "Own topics: delete" on topics for delete using (auth.uid() = user_id);

-- facets
create policy "Own facets: select" on facets for select using (auth.uid() = user_id);
create policy "Own facets: insert" on facets for insert with check (auth.uid() = user_id);
create policy "Own facets: update" on facets for update using (auth.uid() = user_id);
create policy "Own facets: delete" on facets for delete using (auth.uid() = user_id);

-- thoughts
create policy "Own thoughts: select" on thoughts for select using (auth.uid() = user_id);
create policy "Own thoughts: insert" on thoughts for insert with check (auth.uid() = user_id);
create policy "Own thoughts: update" on thoughts for update using (auth.uid() = user_id);
create policy "Own thoughts: delete" on thoughts for delete using (auth.uid() = user_id);

-- conversations
create policy "Own conversations: select" on conversations for select using (auth.uid() = user_id);
create policy "Own conversations: insert" on conversations for insert with check (auth.uid() = user_id);
create policy "Own conversations: update" on conversations for update using (auth.uid() = user_id);
create policy "Own conversations: delete" on conversations for delete using (auth.uid() = user_id);

-- discover_items
create policy "Own discover: select" on discover_items for select using (auth.uid() = user_id);
create policy "Own discover: insert" on discover_items for insert with check (auth.uid() = user_id);
create policy "Own discover: update" on discover_items for update using (auth.uid() = user_id);
create policy "Own discover: delete" on discover_items for delete using (auth.uid() = user_id);

-- ai_cache
create policy "Own ai_cache: select" on ai_cache for select using (auth.uid() = user_id);
create policy "Own ai_cache: insert" on ai_cache for insert with check (auth.uid() = user_id);
create policy "Own ai_cache: update" on ai_cache for update using (auth.uid() = user_id);
create policy "Own ai_cache: delete" on ai_cache for delete using (auth.uid() = user_id);

-- user_settings
create policy "Own settings: select" on user_settings for select using (auth.uid() = user_id);
create policy "Own settings: insert" on user_settings for insert with check (auth.uid() = user_id);
create policy "Own settings: update" on user_settings for update using (auth.uid() = user_id);

-- topic_facets: ownership through the topic
create policy "Own topic_facets: select" on topic_facets for select using (
  exists (select 1 from topics where topics.id = topic_facets.topic_id and topics.user_id = auth.uid())
);
create policy "Own topic_facets: insert" on topic_facets for insert with check (
  exists (select 1 from topics where topics.id = topic_facets.topic_id and topics.user_id = auth.uid())
);
create policy "Own topic_facets: delete" on topic_facets for delete using (
  exists (select 1 from topics where topics.id = topic_facets.topic_id and topics.user_id = auth.uid())
);

-- ============================================
-- TRIGGER: create user_settings on signup
-- ============================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- TRIGGER: keep conversations.updated_at fresh
-- ============================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger conversations_set_updated_at
  before update on conversations
  for each row execute function public.set_updated_at();

create trigger user_settings_set_updated_at
  before update on user_settings
  for each row execute function public.set_updated_at();
