-- Magpie 2.0 Redesign Slice-1: the ENTITY SPINE. ADDITIVE ONLY: four new tables,
-- nothing dropped or rewritten, so the existing community data (the ~171-topic
-- shared account, its subjects/topics/facets/groups) is fully preserved. Run once
-- in the Supabase SQL editor (main / PRODUCTION, role postgres). Re-runnable: every
-- table is `if not exists` and every policy is dropped-if-exists before create.
--
-- The model (see docs/REDESIGN.md):
--   A GLINT is a topic (the user's words). An ENTITY is what a glint is ABOUT
--   (a noun hub: wolves, yellowstone). Entities are many-to-many with glints (one
--   glint rolls up under several hubs) and nest into broader entities as a DAG
--   (wolves -> predators). This generalizes the rare manual is_group groups into
--   the default connective layer. FACETS (the lens/angle) are unchanged.
--
-- What it adds:
--   1. entities        per-user canonical hubs. canonical_key folds case/punctuation
--                      so "Yellowstone"/"yellowstone" collapse to one hub.
--   2. topic_entities  the glint<->entity join (many-to-many). Ownership derives
--                      through the topic, exactly like topic_facets.
--   3. entity_parents  the nesting DAG (child entity -> broader parent entity).
--   4. entity_aliases  variant key -> canonical entity, for dedup across surface forms.

-- 1. entities: the canonical hubs ------------------------------------------
create table if not exists entities (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  name          text not null,
  canonical_key text not null,
  created_at    timestamptz default now(),
  unique(user_id, canonical_key)
);
create index if not exists entities_user_id_idx on entities(user_id);

-- 2. topic_entities: the many-to-many join (ownership through the topic) ----
create table if not exists topic_entities (
  topic_id   uuid references topics(id) on delete cascade not null,
  entity_id  uuid references entities(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (topic_id, entity_id)
);
create index if not exists topic_entities_entity_id_idx on topic_entities(entity_id);

-- 3. entity_parents: the nesting DAG (child -> broader parent) --------------
-- The check blocks self-loops only. Longer cycles (A->B->A) are prevented in the
-- application layer (addEntityParent walks ancestors before inserting).
create table if not exists entity_parents (
  child_entity_id  uuid references entities(id) on delete cascade not null,
  parent_entity_id uuid references entities(id) on delete cascade not null,
  created_at       timestamptz default now(),
  primary key (child_entity_id, parent_entity_id),
  check (child_entity_id <> parent_entity_id)
);
create index if not exists entity_parents_parent_idx on entity_parents(parent_entity_id);

-- 4. entity_aliases: variant key -> canonical entity (dedup) ----------------
-- user_id is denormalized so RLS stays a trivial owner check.
create table if not exists entity_aliases (
  user_id    uuid references auth.users(id) on delete cascade not null,
  alias_key  text not null,
  entity_id  uuid references entities(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (user_id, alias_key)
);
create index if not exists entity_aliases_entity_id_idx on entity_aliases(entity_id);

-- RLS -----------------------------------------------------------------------
alter table entities enable row level security;
alter table topic_entities enable row level security;
alter table entity_parents enable row level security;
alter table entity_aliases enable row level security;

-- entities: owner-only, all four verbs
drop policy if exists "Own entities: select" on entities;
create policy "Own entities: select" on entities for select using (auth.uid() = user_id);
drop policy if exists "Own entities: insert" on entities;
create policy "Own entities: insert" on entities for insert with check (auth.uid() = user_id);
drop policy if exists "Own entities: update" on entities;
create policy "Own entities: update" on entities for update using (auth.uid() = user_id);
drop policy if exists "Own entities: delete" on entities;
create policy "Own entities: delete" on entities for delete using (auth.uid() = user_id);

-- topic_entities: ownership through the topic; insert also checks entity ownership
drop policy if exists "Own topic_entities: select" on topic_entities;
create policy "Own topic_entities: select" on topic_entities for select using (
  exists (select 1 from topics where topics.id = topic_entities.topic_id and topics.user_id = auth.uid())
);
drop policy if exists "Own topic_entities: insert" on topic_entities;
create policy "Own topic_entities: insert" on topic_entities for insert with check (
  exists (select 1 from topics where topics.id = topic_entities.topic_id and topics.user_id = auth.uid())
  and exists (select 1 from entities where entities.id = topic_entities.entity_id and entities.user_id = auth.uid())
);
drop policy if exists "Own topic_entities: delete" on topic_entities;
create policy "Own topic_entities: delete" on topic_entities for delete using (
  exists (select 1 from topics where topics.id = topic_entities.topic_id and topics.user_id = auth.uid())
);

-- entity_parents: ownership through the child entity; insert also checks the parent
drop policy if exists "Own entity_parents: select" on entity_parents;
create policy "Own entity_parents: select" on entity_parents for select using (
  exists (select 1 from entities where entities.id = entity_parents.child_entity_id and entities.user_id = auth.uid())
);
drop policy if exists "Own entity_parents: insert" on entity_parents;
create policy "Own entity_parents: insert" on entity_parents for insert with check (
  exists (select 1 from entities where entities.id = entity_parents.child_entity_id and entities.user_id = auth.uid())
  and exists (select 1 from entities where entities.id = entity_parents.parent_entity_id and entities.user_id = auth.uid())
);
drop policy if exists "Own entity_parents: delete" on entity_parents;
create policy "Own entity_parents: delete" on entity_parents for delete using (
  exists (select 1 from entities where entities.id = entity_parents.child_entity_id and entities.user_id = auth.uid())
);

-- entity_aliases: owner-only (user_id denormalized)
drop policy if exists "Own entity_aliases: select" on entity_aliases;
create policy "Own entity_aliases: select" on entity_aliases for select using (auth.uid() = user_id);
drop policy if exists "Own entity_aliases: insert" on entity_aliases;
create policy "Own entity_aliases: insert" on entity_aliases for insert with check (auth.uid() = user_id);
drop policy if exists "Own entity_aliases: delete" on entity_aliases;
create policy "Own entity_aliases: delete" on entity_aliases for delete using (auth.uid() = user_id);
