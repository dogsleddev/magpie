// Print the community account's curiosity (topic) + subject counts, for the
// landing-page social-proof line. Run:
//   node --env-file=.env.local scripts/community-stats.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.log('RESULT: MISSING_ENV (need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data: list, error: uErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (uErr) {
  console.log('RESULT: USERS_ERR ->', uErr.message);
  process.exit(1);
}
const user = list.users.find((u) => u.email === 'dogsled@dogsled.dev');
if (!user) {
  console.log('RESULT: NO_COMMUNITY_USER (dogsled@dogsled.dev not found)');
  process.exit(0);
}

const topics = await supabase
  .from('topics')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', user.id);
const subjects = await supabase
  .from('subjects')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', user.id);

if (topics.error || subjects.error) {
  console.log('RESULT: COUNT_ERR ->', topics.error?.message ?? subjects.error?.message);
  process.exit(1);
}

console.log(`RESULT: topics=${topics.count} subjects=${subjects.count}`);
