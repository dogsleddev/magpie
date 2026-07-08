-- Bound the public waitlist email length. joinWaitlist inserts through the anon
-- key with no reads, so cap the stored value defensively (real emails are well
-- under 254, the RFC max). Apply via the Supabase SQL editor or `supabase db push`.

alter table waitlist add constraint waitlist_email_len check (char_length(email) <= 254);
