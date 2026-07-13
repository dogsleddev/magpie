import { createClient } from '@/lib/supabase/server';
import type { NestSource, NestSourceTopic } from '@/lib/nest/types';

/**
 * Build the Nest graph source for the current user: subjects, topics (with their
 * subject, group flags, facet ids, and thought count), and facets. A purpose-built
 * narrow read rather than getAllTopics() (which row-multiplies facets and has no
 * thought count). RLS scopes every row to auth.uid(); requires a session, so never
 * call this from the public landing path.
 */

type NestTopicRow = {
  id: string;
  subject_id: string | null;
  title: string;
  is_group: boolean;
  parent_topic_id: string | null;
  topic_facets: { facet_id: string }[];
  thoughts: { count: number }[];
};

export async function getNestGraph(): Promise<NestSource> {
  const supabase = await createClient();
  // The 0009 entity tables are not in the generated types yet, so read them
  // through the same narrow cast the other entity queries use.
  const db = supabase as unknown as { from: (t: string) => any };
  const [subjectsRes, topicsRes, facetsRes, entitiesRes, linksRes, parentsRes] = await Promise.all([
    supabase.from('subjects').select('id, name').order('position', { ascending: true }),
    supabase
      .from('topics')
      .select('id, subject_id, title, is_group, parent_topic_id, topic_facets(facet_id), thoughts(count)')
      .order('position', { ascending: true })
      .returns<NestTopicRow[]>(),
    supabase.from('facets').select('id, name').order('name', { ascending: true }),
    db.from('entities').select('id, name'),
    db.from('topic_entities').select('topic_id, entity_id'),
    db.from('entity_parents').select('child_entity_id, parent_entity_id'),
  ]);
  if (subjectsRes.error) throw subjectsRes.error;
  if (topicsRes.error) throw topicsRes.error;
  if (facetsRes.error) throw facetsRes.error;
  // The entity reads ride the untyped cast path and back an off-by-default layer.
  // A failure logs and degrades (the teal layer just drops) rather than throwing
  // and taking down the whole graph over an additive dimension.
  if (entitiesRes.error) console.error('[getNestGraph] entities read failed:', entitiesRes.error);
  if (linksRes.error) console.error('[getNestGraph] topic_entities read failed:', linksRes.error);
  if (parentsRes.error) console.error('[getNestGraph] entity_parents read failed:', parentsRes.error);

  const entityIdsByTopic = new Map<string, string[]>();
  for (const l of (linksRes.data ?? []) as { topic_id: string; entity_id: string }[]) {
    const arr = entityIdsByTopic.get(l.topic_id);
    if (arr) arr.push(l.entity_id);
    else entityIdsByTopic.set(l.topic_id, [l.entity_id]);
  }

  const topics: NestSourceTopic[] = (topicsRes.data ?? [])
    .filter((t) => t.subject_id)
    .map((t) => ({
      id: t.id,
      subjectId: t.subject_id as string,
      title: t.title,
      isGroup: t.is_group,
      parentId: t.parent_topic_id,
      facetIds: (t.topic_facets ?? []).map((tf) => tf.facet_id),
      entityIds: entityIdsByTopic.get(t.id) ?? [],
      weight: t.thoughts?.[0]?.count ?? 0,
    }));

  return {
    subjects: (subjectsRes.data ?? []).map((s) => ({ id: s.id, name: s.name })),
    topics,
    facets: (facetsRes.data ?? []).map((f) => ({ id: f.id, name: f.name })),
    entities: ((entitiesRes.data ?? []) as { id: string; name: string }[]).map((e) => ({
      id: e.id,
      name: e.name,
    })),
    entityParents: (
      (parentsRes.data ?? []) as { child_entity_id: string; parent_entity_id: string }[]
    ).map((e) => ({ childId: e.child_entity_id, parentId: e.parent_entity_id })),
  };
}
