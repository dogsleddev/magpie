'use server';

import { createClient, requireUser } from '@/lib/supabase/server';
import { STARTER_PACK } from '@/lib/seed/starter-topics';

export type SeedResult = {
  subjects: number;
  facets: number;
  topics: number;
  alreadySeeded: boolean;
};

/**
 * Seed a new user with the curated starter pack: subjects, facets, topics, and
 * the topic_facet links between them. Idempotent: a no-op if the user already
 * has subjects.
 */
export async function seedStarterTopics(): Promise<SeedResult> {
  const supabase = await createClient();
  const user = await requireUser();

  const { count, error: countErr } = await supabase
    .from('subjects')
    .select('id', { count: 'exact', head: true });
  if (countErr) throw countErr;
  if ((count ?? 0) > 0) {
    return { subjects: 0, facets: 0, topics: 0, alreadySeeded: true };
  }

  // 1. Subjects (ordered by their position in the pack).
  const subjectRows = STARTER_PACK.map((subject, index) => ({
    name: subject.name,
    position: index,
    user_id: user.id,
  }));
  const { data: subjects, error: subjectErr } = await supabase
    .from('subjects')
    .insert(subjectRows)
    .select('id, name');
  if (subjectErr) throw subjectErr;
  const subjectIdByName = new Map(subjects.map((s) => [s.name, s.id]));

  // 2. Facets (unique across the whole pack).
  const facetNames = Array.from(
    new Set(
      STARTER_PACK.flatMap((subject) =>
        subject.topics.flatMap((topic) => topic.facets.map((f) => f.trim())),
      ),
    ),
  );
  const { data: facets, error: facetErr } = await supabase
    .from('facets')
    .insert(facetNames.map((name) => ({ name, user_id: user.id })))
    .select('id, name');
  if (facetErr) throw facetErr;
  const facetIdByName = new Map(facets.map((f) => [f.name, f.id]));

  // 3. Topics (positioned within each subject).
  const topicRows = STARTER_PACK.flatMap((subject) => {
    const subjectId = subjectIdByName.get(subject.name);
    if (!subjectId) return [];
    return subject.topics.map((topic, index) => ({
      title: topic.title,
      subject_id: subjectId,
      user_id: user.id,
      position: index,
    }));
  });
  const { data: topics, error: topicErr } = await supabase
    .from('topics')
    .insert(topicRows)
    .select('id, title, subject_id');
  if (topicErr) throw topicErr;
  const topicIdByKey = new Map(topics.map((t) => [`${t.subject_id}|${t.title}`, t.id]));

  // 4. topic_facets links.
  const linkRows: { topic_id: string; facet_id: string }[] = [];
  for (const subject of STARTER_PACK) {
    const subjectId = subjectIdByName.get(subject.name);
    if (!subjectId) continue;
    for (const topic of subject.topics) {
      const topicId = topicIdByKey.get(`${subjectId}|${topic.title}`);
      if (!topicId) continue;
      for (const facetName of topic.facets) {
        const facetId = facetIdByName.get(facetName.trim());
        if (facetId) linkRows.push({ topic_id: topicId, facet_id: facetId });
      }
    }
  }
  if (linkRows.length > 0) {
    const { error: linkErr } = await supabase.from('topic_facets').insert(linkRows);
    if (linkErr) throw linkErr;
  }

  return {
    subjects: subjects.length,
    facets: facets.length,
    topics: topics.length,
    alreadySeeded: false,
  };
}
