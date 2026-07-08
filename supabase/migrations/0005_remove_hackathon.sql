-- Remove the Krava x Linq hackathon schema that 0002 added. The iMessage front
-- door and the Krava privacy layer are no longer part of the product. Every
-- statement is idempotent, so this is safe on the prod DB (which ran 0002) and
-- on a fresh DB (which never did). Apply via the Supabase SQL editor or
-- `supabase db push`.

drop table if exists imessage_inbox;

alter table user_settings drop column if exists phone_number;

drop index if exists conversations_user_kind_idx;
alter table conversations drop column if exists kind;

alter table topics drop column if exists source;

-- Note: 0002 also relaxed conversations.topic_id to nullable. We leave it nullable
-- on purpose: reverting to NOT NULL would fail if any legacy null row remains, and
-- in-app Convo always sets topic_id, so nullable is harmless.
