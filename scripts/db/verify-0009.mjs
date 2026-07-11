// READ-ONLY: confirm migration 0009 (the entity spine) landed on the DB. Selecting
// a table/column that does not exist errors, so a clean OK for each means the schema
// is in place. Run:
//   node --env-file=.env.local scripts/db/verify-0009.mjs
import { createClient } from '@supabase/supabase-js';

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const checks = [
  ['entities table', () => s.from('entities').select('id, name, canonical_key').limit(1)],
  ['topic_entities join', () => s.from('topic_entities').select('topic_id, entity_id').limit(1)],
  ['entity_parents DAG', () => s.from('entity_parents').select('child_entity_id, parent_entity_id').limit(1)],
  ['entity_aliases table', () => s.from('entity_aliases').select('user_id, alias_key, entity_id').limit(1)],
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
console.log(ok ? '\nRESULT: 0009 fully applied.' : '\nRESULT: something is missing (see FAIL lines).');
