// Create a confirmed email/password user directly in Supabase auth.
// No secrets in this file: DB password from SUPABASE_DB_PASSWORD; the user's
// email + password are passed as argv. Idempotent (re-running replaces the user).
// Usage: SUPABASE_DB_PASSWORD=... node scripts/db/create-user.mjs <email> <password>
import pg from 'pg';
import { dbSsl } from './ssl.mjs';

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error('Set SUPABASE_DB_PASSWORD');
  process.exit(1);
}
const email = process.argv[2];
const userPw = process.argv[3];
if (!email || !userPw) {
  console.error('usage: node scripts/db/create-user.mjs <email> <password>');
  process.exit(1);
}

const client = new pg.Client({
  host: process.env.SUPABASE_DB_HOST || 'aws-1-us-east-2.pooler.supabase.com',
  port: Number(process.env.SUPABASE_DB_PORT || 5432),
  user: process.env.SUPABASE_DB_USER || 'postgres.tbmdwivhekzfkeidbwia',
  password,
  database: 'postgres',
  ssl: dbSsl(),
});

try {
  await client.connect();
  await client.query('create extension if not exists pgcrypto with schema extensions');
  await client.query('set search_path to public, extensions');
  await client.query('delete from auth.users where email = $1', [email]);
  const res = await client.query(
    `with nu as (
       insert into auth.users (
         instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
         raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
         confirmation_token, email_change, email_change_token_new, recovery_token
       ) values (
         '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
         $1, crypt($2, gen_salt('bf')), now(),
         '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
         '', '', '', ''
       ) returning id, email
     )
     insert into auth.identities (
       id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
     )
     select gen_random_uuid(), id, id::text,
       jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true, 'phone_verified', false),
       'email', now(), now(), now()
     from nu
     returning user_id`,
    [email, userPw],
  );
  console.log('Created confirmed user:', email, '-> id', res.rows[0]?.user_id);
} catch (e) {
  console.error('FAILED:', e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
