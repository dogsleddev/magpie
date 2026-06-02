// Verify the waitlist table is live and accepts public sign-ups, using the anon
// key (same access a landing visitor has). Run:
//   node --env-file=.env.local scripts/verify-waitlist.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.log('RESULT: MISSING_ENV (need NEXT_PUBLIC_SUPABASE_URL + ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(url, key);

// 1. Existence check: with RLS + no SELECT policy this returns [] if the table
//    exists, or an error (PGRST205 / 42P01) if it does not.
const { error: selErr } = await supabase.from('waitlist').select('id').limit(1);
if (selErr) {
  console.log('RESULT: NOT_READY ->', selErr.code, '|', selErr.message);
  process.exit(0);
}
console.log('RESULT: TABLE_EXISTS (anon SELECT returns empty as expected under RLS)');

// 2. Insert check: prove the public INSERT policy accepts a sign-up.
const probe = `verify+${Date.now()}@dogsled.dev`;
const { error: insErr } = await supabase.from('waitlist').insert({ email: probe, source: 'verify-script' });
if (insErr) {
  console.log('RESULT: INSERT_BLOCKED ->', insErr.code, '|', insErr.message);
} else {
  console.log('RESULT: INSERT_OK -> a probe row was added:', probe);
  console.log('NOTE: delete that row in the Supabase dashboard if you want a clean list.');
}
