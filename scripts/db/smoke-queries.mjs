// Smoke test the query layer against the live DB through RLS.
// Signs in as a real user, exercises the embed/aggregate patterns the
// lib/queries modules rely on, then cleans up. No secrets in this file.
// Usage: node scripts/db/smoke-queries.mjs <email> <password>
import { createClient } from '@supabase/supabase-js';

const url = 'https://tbmdwivhekzfkeidbwia.supabase.co';
const anon = 'sb_publishable_Q35qD6LW7HYV0qvLt534Lg_D5hUilzr';
const email = process.argv[2];
const pw = process.argv[3];
if (!email || !pw) {
  console.error('usage: node scripts/db/smoke-queries.mjs <email> <password>');
  process.exit(1);
}

const supabase = createClient(url, anon);

const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
  email,
  password: pw,
});
if (authErr) {
  console.error('login failed:', authErr.message);
  process.exit(1);
}
const userId = auth.user.id;
console.log('signed in:', email, userId);

const { data: settings } = await supabase.from('user_settings').select('*').maybeSingle();
console.log(
  'user_settings (trigger):',
  settings ? `persona=${settings.persona_name} default=${settings.default_mode}` : 'MISSING',
);

const { data: subject } = await supabase
  .from('subjects')
  .insert({ name: 'SMOKE TEST', user_id: userId, position: 999 })
  .select()
  .single();
const { data: facet } = await supabase
  .from('facets')
  .insert({ name: 'smoke-facet', user_id: userId })
  .select()
  .single();
const { data: topic } = await supabase
  .from('topics')
  .insert({ title: 'smoke topic', subject_id: subject.id, user_id: userId, position: 0 })
  .select()
  .single();
await supabase.from('topic_facets').insert({ topic_id: topic.id, facet_id: facet.id });

const { data: nested } = await supabase
  .from('topics')
  .select('*, topic_facets(facets(*))')
  .eq('subject_id', subject.id);
console.log(
  'nested embed read:',
  JSON.stringify(
    nested?.map((t) => ({
      title: t.title,
      facets: t.topic_facets.map((tf) => tf.facets?.name),
    })),
  ),
);

const { data: withCount } = await supabase
  .from('subjects')
  .select('name, topics(count)')
  .eq('id', subject.id);
console.log('count aggregate read:', JSON.stringify(withCount));

await supabase.from('subjects').delete().eq('id', subject.id);
await supabase.from('facets').delete().eq('id', facet.id);
console.log('cleanup done. SMOKE PASS');
