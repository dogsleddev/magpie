// READ-ONLY probe of the live community account's Red Rising state, for the
// facet-to-group decision. No writes. Run:
//   node --env-file=.env.local scripts/red-rising-probe.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.log('RESULT: MISSING_ENV');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
const user = list.users.find((u) => u.email === 'dogsled@dogsled.dev');
if (!user) {
  console.log('RESULT: NO_COMMUNITY_USER');
  process.exit(0);
}

const { data: topics } = await supabase
  .from('topics')
  .select('id, title, is_group, parent_topic_id, subject_id')
  .eq('user_id', user.id);
const { data: facets } = await supabase
  .from('facets')
  .select('id, name')
  .eq('user_id', user.id);
const { data: links } = await supabase.from('topic_facets').select('topic_id, facet_id');

const topicById = new Map(topics.map((t) => [t.id, t]));
const mine = new Set(topics.map((t) => t.id));
const linkCount = new Map();
for (const l of links) {
  if (!mine.has(l.topic_id)) continue;
  linkCount.set(l.facet_id, (linkCount.get(l.facet_id) ?? 0) + 1);
}

console.log('--- facets by topic count ---');
for (const f of facets.sort((a, b) => (linkCount.get(b.id) ?? 0) - (linkCount.get(a.id) ?? 0))) {
  console.log(`${String(linkCount.get(f.id) ?? 0).padStart(3)}  ${f.name}`);
}

const rr = facets.find((f) => f.name.toLowerCase() === 'red rising');
console.log('\n--- red rising facet ---');
if (rr) {
  const tagged = links.filter((l) => l.facet_id === rr.id && mine.has(l.topic_id));
  console.log(`facet exists (${rr.id}), tagged topics: ${tagged.length}`);
  for (const l of tagged) {
    const t = topicById.get(l.topic_id);
    console.log(`  - "${t.title}" group=${t.is_group} parent=${t.parent_topic_id ? 'YES' : 'no'}`);
  }
} else {
  console.log('no red rising facet');
}

console.log('\n--- group topics (is_group) ---');
for (const t of topics.filter((t) => t.is_group)) {
  const kids = topics.filter((k) => k.parent_topic_id === t.id);
  console.log(`"${t.title}": ${kids.length} children`);
  for (const k of kids) console.log(`  - ${k.title}`);
}

console.log('\n--- orphan "Series:" style titles (colon prefix, no parent) ---');
const prefixCount = new Map();
for (const t of topics) {
  const m = t.title.match(/^([^:]{2,40}):\s/);
  if (m) {
    const p = m[1];
    prefixCount.set(p, (prefixCount.get(p) ?? 0) + 1);
  }
}
for (const [p, n] of [...prefixCount.entries()].sort((a, b) => b[1] - a[1])) {
  if (n < 2) continue;
  const kids = topics.filter((t) => t.title.startsWith(p + ':'));
  const unparented = kids.filter((t) => !t.parent_topic_id);
  console.log(`"${p}": ${n} topics, ${unparented.length} without a parent`);
}

console.log(`\nRESULT: topics=${topics.length} facets=${facets.length}`);
