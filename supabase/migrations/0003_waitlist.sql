-- 0003_waitlist.sql
-- Public waitlist capture for the marketing landing page.
--
-- Anyone (anon or authenticated) can add their email. Nobody can read the list
-- back through the API: there is no SELECT policy, so RLS denies reads to the
-- anon and authenticated roles. Reads happen in the Supabase dashboard or via
-- the service role (which bypasses RLS).

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

-- Public sign-ups: INSERT only. No select/update/delete policies => denied.
create policy "anyone can join the waitlist"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);
