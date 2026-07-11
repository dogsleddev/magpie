// READ-ONLY: confirm migration 0008 (Slice-0) landed on the DB. Selecting a
// column/table that does not exist errors, so a clean OK for each means the
// schema is in place. Run:
//   node --env-file=.env.local scripts/db/verify-0008.mjs
import { createClient } from '@supabase/supabase-js';

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const checks = [
  ['activity_days table', () => s.from('activity_days').select('user_id').limit(1)],
  ['usage_events table', () => s.from('usage_events').select('id').limit(1)],
  ['topics.brief_seed + raw_input', () => s.from('topics').select('id, brief_seed, raw_input').limit(1)],
  ['user_settings.timezone', () => s.from('user_settings').select('user_id, timezone').limit(1)],
];

let ok = true;
for (const [name, run] of checks) {
  const { error } = await run();
  if (error) {
    ok = false;
    console.log('FAIL  ' + name + '  -> ' + error.message);
  } else {
    console.log('OK    ' + name);
  }
}
console.log(ok ? '\nRESULT: 0008 fully applied.' : '\nRESULT: something is missing (see FAIL lines).');
