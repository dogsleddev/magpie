-- Magpie 2.0 Slice-0 schema. ADDITIVE ONLY: new columns and new tables. Nothing
-- is dropped or rewritten, so the existing community data (the ~171-topic shared
-- account) is fully preserved and stays editable. Run once in the Supabase SQL
-- editor. This is the prerequisite for the glint capture + connection + streak loop.
--
-- Note on the shared account: in Slice-0 the loop runs on the one shared
-- `dogsled@dogsled.dev` account (for dogfooding), so the streak below is that
-- account's streak. Per-user streaks arrive with per-user auth in Phase 1; no
-- schema change is needed then, because these tables already key on user_id.
--
-- What it adds:
--   1. user_settings.timezone       the per-user IANA tz. "Today" is computed from
--                                    it. Defaults to America/Los_Angeles (PST) when
--                                    unknown, per the locked decision.
--   2. topics.brief_seed, raw_input  a glint of more than 3 words seeds the Brief;
--                                    the raw input is kept verbatim. A glint IS a
--                                    topic (same table, no separate glints store).
--   3. activity_days                 the streak source of truth: one row per local
--                                    date a user caught a glint. Current and longest
--                                    streak derive from the contiguous run of dates;
--                                    a make-up row can be inserted for a missed date
--                                    within the 7-day recovery window.
--   4. usage_events                  D1/D3/D7 analytics from day one, so the loop's
--                                    retention is measurable during the dogfood.

-- 1. Timezone (default PST when unknown) -----------------------------------
alter table user_settings
  add column if not exists timezone text not null default 'America/Los_Angeles';

-- 2. Glint = topic: seed + raw input ---------------------------------------
alter table topics add column if not exists brief_seed text;
alter table topics add column if not exists raw_input text;

-- 3. activity_days: the streak source of truth -----------------------------
create table if not exists activity_days (
  user_id       uuid references auth.users(id) on delete cascade not null,
  activity_date date not null,
  covered_by    text not null default 'glint',
  covered_at    timestamptz not null default now(),
  primary key (user_id, activity_date)
);

alter table activity_days enable row level security;

create policy "Users see own activity_days"
  on activity_days for select
  using (auth.uid() = user_id);

create policy "Users insert own activity_days"
  on activity_days for insert
  with check (auth.uid() = user_id);

-- 4. usage_events: product analytics ---------------------------------------
-- user_id is nullable so logged-out/public events can be added later; the insert
-- policy below only permits an authenticated user to write their own rows, which
-- is all Slice-0 needs (every event is from the signed-in shared account).
create table if not exists usage_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  event      text not null,
  props      jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists usage_events_user_created_idx on usage_events (user_id, created_at);

alter table usage_events enable row level security;

create policy "Users see own usage_events"
  on usage_events for select
  using (auth.uid() = user_id);

create policy "Users insert own usage_events"
  on usage_events for insert
  with check (auth.uid() = user_id);
