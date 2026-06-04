import { createClient, requireUser } from '@/lib/supabase/server';
import { STARTER_PACK } from '@/lib/seed/starter-topics';

export type BackfillSportsResult = {
  created: boolean;
  subjectId: string | null;
  topics: number;
  facetsCreated: number;
  note: string;
};

/**
 * One-time backfill for accounts seeded before "Sports" joined the starter pack
 * (e.g. the shared community account). Adds the Sports subject and its topics
 * straight from STARTER_PACK, reusing existing facets and creating any missing.
 * Idempotent: a no-op if the user already has a Sports subject. RLS scopes every
 * operation to the current user.
 */
export async function backfillSports(): Promise<BackfillSportsResult> {
  const supabase = await createClient();
  const user = await requireUser();

  const pack = STARTER_PACK.find((s) => s.name === 'Sports');
  if (!pack) {
    return {
      created: false,
      subjectId: null,
      topics: 0,
      facetsCreated: 0,
      note: 'Sports not in the seed pack.',
    };
  }

  // Idempotent: skip if a Sports subject already exists for this user.
  const { data: existing, error: existErr } = await supabase
    .from('subjects')
    .select('id')
    .eq('name', 'Sports')
    .limit(1);
  if (existErr) throw existErr;
  if (existing && existing.length > 0) {
    return {
      created: false,
      subjectId: existing[0].id,
      topics: 0,
      facetsCreated: 0,
      note: 'Sports already exists.',
    };
  }

  // Place the new subject at the end of the user's grid.
  const { data: lastSubject } = await supabase
    .from('subjects')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (lastSubject?.position ?? -1) + 1;

  const { data: subject, error: subjectErr } = await supabase
    .from('subjects')
    .insert({ name: 'Sports', position, user_id: user.id })
    .select('id')
    .single();
  if (subjectErr) throw subjectErr;
  const subjectId = subject.id;

  // Resolve facets: reuse the user's existing ones by name, create any missing.
  const facetNames = Array.from(new Set(pack.topics.flatMap((t) => t.facets.map((f) => f.trim()))));
  const { data: existingFacets, error: facetReadErr } = await supabase
    .from('facets')
    .select('id, name')
    .in('name', facetNames);
  if (facetReadErr) throw facetReadErr;
  const facetIdByName = new Map((existingFacets ?? []).map((f) => [f.name, f.id]));
  const missing = facetNames.filter((n) => !facetIdByName.has(n));
  let facetsCreated = 0;
  if (missing.length > 0) {
    const { data: created, error: facetErr } = await supabase
      .from('facets')
      .insert(missing.map((name) => ({ name, user_id: user.id })))
      .select('id, name');
    if (facetErr) throw facetErr;
    for (const f of created ?? []) facetIdByName.set(f.name, f.id);
    facetsCreated = created?.length ?? 0;
  }

  // Topics (Sports has no groups/sub-topics, so one pass).
  const topicRows = pack.topics.map((topic, index) => ({
    title: topic.title,
    subject_id: subjectId,
    user_id: user.id,
    position: index,
  }));
  const { data: topics, error: topicErr } = await supabase
    .from('topics')
    .insert(topicRows)
    .select('id, title');
  if (topicErr) throw topicErr;
  const topicIdByTitle = new Map((topics ?? []).map((t) => [t.title, t.id]));

  // topic_facets links.
  const linkRows: { topic_id: string; facet_id: string }[] = [];
  for (const topic of pack.topics) {
    const topicId = topicIdByTitle.get(topic.title);
    if (!topicId) continue;
    for (const facetName of topic.facets) {
      const facetId = facetIdByName.get(facetName.trim());
      if (facetId) linkRows.push({ topic_id: topicId, facet_id: facetId });
    }
  }
  if (linkRows.length > 0) {
    const { error: linkErr } = await supabase.from('topic_facets').insert(linkRows);
    if (linkErr) throw linkErr;
  }

  return {
    created: true,
    subjectId,
    topics: topics?.length ?? 0,
    facetsCreated,
    note: 'Sports subject + topics added.',
  };
}
