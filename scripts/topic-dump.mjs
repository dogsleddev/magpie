// READ-ONLY dump of the live community account's full topic tree, grouped by
// subject with facets per topic, for the parent/subtopic analysis. Run:
//   node --env-file=.env.local scripts/topic-dump.mjs
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

const [{ data: subjects }, { data: topics }, { data: facets }, { data: links }] =
  await Promise.all([
    supabase.from('subjects').select('id, name').eq('user_id', user.id),
    supabase
      .from('topics')
      .select('id, title, subject_id, is_group, parent_topic_id')
      .eq('user_id', user.id)
      .order('position'),
    supabase.from('facets').select('id, name').eq('user_id', user.id),
    supabase.from('topic_facets').select('topic_id, facet_id'),
  ]);

const facetName = new Map(facets.map((f) => [f.id, f.name]));
const topicFacets = new Map();
for (const l of links) {
  if (!topicFacets.has(l.topic_id)) topicFacets.set(l.topic_id, []);
  const n = facetName.get(l.facet_id);
  if (n) topicFacets.get(l.topic_id).push(n);
}

for (const s of subjects.sort((a, b) => a.name.localeCompare(b.name))) {
  const mine = topics.filter((t) => t.subject_id === s.id);
  console.log(`\n## ${s.name} (${mine.length})`);
  for (const t of mine) {
    const flags = [t.is_group ? 'GROUP' : null, t.parent_topic_id ? 'CHILD' : null]
      .filter(Boolean)
      .join(',');
    const f = (topicFacets.get(t.id) ?? []).join(', ');
    console.log(`- ${t.title}${flags ? ` [${flags}]` : ''}${f ? `  {${f}}` : ''}`);
  }
}
console.log(`\nRESULT: ${topics.length} topics, ${subjects.length} subjects`);
