// One-time grouping backfill for the live community account:
//   1. Red Rising: find/create the group in Books, reparent the 3 "Red Rising:"
//      children, then DELETE the `red rising` facet (links cascade).
//   2. Corvids: create the group in Wildlife, reparent the 3 corvid topics.
// Idempotent. Scoped to dogsled@dogsled.dev rows only.
//
// Dry run (default):  node --env-file=.env.local scripts/group-backfill.mjs
// Execute:            node --env-file=.env.local scripts/group-backfill.mjs --write
import { createClient } from '@supabase/supabase-js';

const WRITE = process.argv.includes('--write');
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
  process.exit(1);
}

const { data: subjects } = await supabase
  .from('subjects')
  .select('id, name')
  .eq('user_id', user.id);
const { data: topics } = await supabase
  .from('topics')
  .select('id, title, subject_id, is_group, parent_topic_id')
  .eq('user_id', user.id);

const subjectByName = new Map(subjects.map((s) => [s.name, s.id]));
const log = (msg) => console.log(`${WRITE ? '[write]' : '[dry]'} ${msg}`);

async function ensureGroup({ parentTitle, subjectName, childTitles }) {
  const subjectId = subjectByName.get(subjectName);
  if (!subjectId) throw new Error(`subject not found: ${subjectName}`);

  const children = topics.filter(
    (t) => t.subject_id === subjectId && childTitles.includes(t.title),
  );
  if (children.length === 0) {
    log(`${parentTitle}: no children found, skipping`);
    return;
  }
  if (children.length < childTitles.length) {
    const found = new Set(children.map((c) => c.title));
    for (const missing of childTitles.filter((t) => !found.has(t)))
      log(`${parentTitle}: child NOT FOUND (skipped): "${missing}"`);
  }

  let parent = topics.find((t) => t.subject_id === subjectId && t.title === parentTitle);
  if (parent) {
    log(`${parentTitle}: parent exists (${parent.id}), is_group=${parent.is_group}`);
    if (!parent.is_group && WRITE) {
      const { error } = await supabase
        .from('topics')
        .update({ is_group: true, parent_topic_id: null })
        .eq('id', parent.id);
      if (error) throw error;
    }
    if (!parent.is_group) log(`${parentTitle}: promote to is_group=true`);
  } else {
    log(`${parentTitle}: create group topic in ${subjectName}`);
    if (WRITE) {
      const { data: created, error } = await supabase
        .from('topics')
        .insert({
          title: parentTitle,
          subject_id: subjectId,
          user_id: user.id,
          position: 0,
          is_group: true,
        })
        .select('id, title, subject_id, is_group, parent_topic_id')
        .single();
      if (error) throw error;
      parent = created;
    } else {
      parent = { id: 'NEW' };
    }
  }

  const toParent = children.filter((c) => c.id !== parent.id && c.parent_topic_id !== parent.id);
  for (const c of toParent) log(`${parentTitle}: reparent "${c.title}"`);
  if (toParent.length === 0) log(`${parentTitle}: all children already parented`);
  if (WRITE && toParent.length > 0) {
    const { error } = await supabase
      .from('topics')
      .update({ parent_topic_id: parent.id, is_group: false })
      .in(
        'id',
        toParent.map((c) => c.id),
      );
    if (error) throw error;
  }
}

await ensureGroup({
  parentTitle: 'Red Rising',
  subjectName: 'Books',
  childTitles: [
    'Red Rising: the color caste as social commentary',
    'Red Rising: how the Society actually governs',
    'Red Rising: the Howler initiation as the moral pivot',
  ],
});

await ensureGroup({
  parentTitle: 'Corvids',
  subjectName: 'Wildlife',
  childTitles: [
    'Magpies pass the mirror self-recognition test',
    'Ravens hold funerals',
    'Why crows give gifts to humans who feed them',
  ],
});

// Red Rising facet removal (topic_facets links cascade via FK)
const { data: rrFacet } = await supabase
  .from('facets')
  .select('id, name')
  .eq('user_id', user.id)
  .ilike('name', 'red rising');
if (rrFacet && rrFacet.length > 0) {
  log(`delete facet "red rising" (${rrFacet[0].id}); links cascade`);
  if (WRITE) {
    const { error } = await supabase.from('facets').delete().eq('id', rrFacet[0].id);
    if (error) throw error;
  }
} else {
  log('red rising facet: already gone');
}

console.log(`\nRESULT: ${WRITE ? 'EXECUTED' : 'DRY RUN ONLY (pass --write to execute)'}`);
