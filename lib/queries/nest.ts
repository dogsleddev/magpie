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
  const [subjectsRes, topicsRes, facetsRes] = await Promise.all([
    supabase.from('subjects').select('id, name').order('position', { ascending: true }),
    supabase
      .from('topics')
      .select('id, subject_id, title, is_group, parent_topic_id, topic_facets(facet_id), thoughts(count)')
      .order('position', { ascending: true })
      .returns<NestTopicRow[]>(),
    supabase.from('facets').select('id, name').order('name', { ascending: true }),
  ]);
  if (subjectsRes.error) throw subjectsRes.error;
  if (topicsRes.error) throw topicsRes.error;
  if (facetsRes.error) throw facetsRes.error;

  const topics: NestSourceTopic[] = (topicsRes.data ?? [])
    .filter((t) => t.subject_id)
    .map((t) => ({
      id: t.id,
      subjectId: t.subject_id as string,
      title: t.title,
      isGroup: t.is_group,
      parentId: t.parent_topic_id,
      facetIds: (t.topic_facets ?? []).map((tf) => tf.facet_id),
      weight: t.thoughts?.[0]?.count ?? 0,
    }));

  return {
    subjects: (subjectsRes.data ?? []).map((s) => ({ id: s.id, name: s.name })),
    topics,
    facets: (facetsRes.data ?? []).map((f) => ({ id: f.id, name: f.name })),
  };
}
