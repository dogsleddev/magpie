-- Magpie hackathon additions (Krava x Linq). Additive and idempotent-ish; the
-- base product on master ignores these columns/tables. Apply after 0001.

-- Link a user to their iMessage phone number (for webhook lookup).
alter table user_settings add column if not exists phone_number text unique;

-- Mark where a topic came from.
alter table topics add column if not exists source text not null default 'manual'
  check (source in ('manual', 'ai_assist', 'imessage', 'discover'));

-- Distinguish iMessage conversations from in-app Convo.
alter table conversations add column if not exists kind text not null default 'convo'
  check (kind in ('convo', 'imessage', 'drawout'));

-- An iMessage conversation exists BEFORE it is organized into a topic, so the
-- topic link must be optional. (0001 had it NOT NULL.)
alter table conversations alter column topic_id drop not null;

create index if not exists conversations_user_kind_idx
  on conversations(user_id, kind, updated_at desc);

-- Inbox for iMessage-originated content not yet organized into a topic.
create table if not exists imessage_inbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  conversation_id uuid references conversations(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'dismissed')),
  proposed_title text,
  proposed_subject text,
  proposed_facets text[],
  organized_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists imessage_inbox_user_id_idx on imessage_inbox(user_id, status);

alter table imessage_inbox enable row level security;

drop policy if exists "Own imessage_inbox: select" on imessage_inbox;
drop policy if exists "Own imessage_inbox: insert" on imessage_inbox;
drop policy if exists "Own imessage_inbox: update" on imessage_inbox;
drop policy if exists "Own imessage_inbox: delete" on imessage_inbox;
create policy "Own imessage_inbox: select" on imessage_inbox for select using (auth.uid() = user_id);
create policy "Own imessage_inbox: insert" on imessage_inbox for insert with check (auth.uid() = user_id);
create policy "Own imessage_inbox: update" on imessage_inbox for update using (auth.uid() = user_id);
create policy "Own imessage_inbox: delete" on imessage_inbox for delete using (auth.uid() = user_id);
