import { createClient, requireUser } from '@/lib/supabase/server';
import { setTopicFacets } from './facets';
import type {
  CreateTopicInput,
  Facet,
  Subject,
  Thought,
  Topic,
  TopicFull,
  TopicWithFacets,
  TopicWithSubjectAndFacets,
} from './types';

type FacetEmbed = { facets: Facet | null };
type TopicWithFacetEmbed = Topic & { topic_facets: FacetEmbed[] };
type TopicWithSubjectFacetEmbed = Topic & {
  subject: Subject | null;
  topic_facets: FacetEmbed[];
};

function flattenFacets(embed: FacetEmbed[] | null): Facet[] {
  return (embed ?? []).map((tf) => tf.facets).filter((f): f is Facet => f !== null);
}

function toWithSubjectAndFacets(row: TopicWithSubjectFacetEmbed): TopicWithSubjectAndFacets {
  const { topic_facets, subject, ...topic } = row;
  return { ...topic, subject: subject as Subject, facets: flattenFacets(topic_facets) };
}

export async function getTopicsBySubject(subjectId: string): Promise<TopicWithFacets[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('topics')
    .select('*, topic_facets(facets(*))')
    .eq('subject_id', subjectId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })
    .returns<TopicWithFacetEmbed[]>();
  if (error) throw error;
  return (data ?? []).map(({ topic_facets, ...topic }) => ({
    ...topic,
    facets: flattenFacets(topic_facets),
  }));
}

export async function getTopicsByFacet(facetId: string): Promise<TopicWithSubjectAndFacets[]> {
  const supabase = await createClient();
  const { data: links, error: linkErr } = await supabase
    .from('topic_facets')
    .select('topic_id')
    .eq('facet_id', facetId);
  if (linkErr) throw linkErr;
  const ids = (links ?? []).map((l) => l.topic_id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('topics')
    .select('*, subject:subjects(*), topic_facets(facets(*))')
    .in('id', ids)
    .order('created_at', { ascending: true })
    .returns<TopicWithSubjectFacetEmbed[]>();
  if (error) throw error;
  return (data ?? []).map(toWithSubjectAndFacets);
}

export async function getAllTopics(): Promise<TopicWithSubjectAndFacets[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('topics')
    .select('*, subject:subjects(*), topic_facets(facets(*))')
    .order('created_at', { ascending: true })
    .returns<TopicWithSubjectFacetEmbed[]>();
  if (error) throw error;
  return (data ?? []).map(toWithSubjectAndFacets);
}

export type TopicLite = {
  id: string;
  title: string;
  subject_id: string;
  parent_topic_id: string | null;
  is_group: boolean;
};

/** Light list of every topic, for the umbrella (entity-grouping) check. */
export async function getTopicsLite(): Promise<TopicLite[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('topics')
    .select('id, title, subject_id, parent_topic_id, is_group')
    .returns<TopicLite[]>();
  if (error) throw error;
  return data ?? [];
}

/** Promote a topic to a group anchor (Subject -> group -> sub-topics). */
export async function promoteTopicToGroup(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('topics')
    .update({ is_group: true, parent_topic_id: null })
    .eq('id', id);
  if (error) throw error;
}

/**
 * Nest topics under a group parent. Children follow the parent's subject
 * (entity membership decides where a topic lives), appended at the end.
 */
export async function adoptTopicsUnderGroup(
  parentId: string,
  parentSubjectId: string,
  childIds: string[],
): Promise<void> {
  if (childIds.length === 0) return;
  const supabase = await createClient();
  const { data: last } = await supabase
    .from('topics')
    .select('position')
    .eq('subject_id', parentSubjectId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  let position = (last?.position ?? -1) + 1;
  for (const id of childIds) {
    const { error } = await supabase
      .from('topics')
      .update({
        parent_topic_id: parentId,
        is_group: false,
        subject_id: parentSubjectId,
        position: position++,
      })
      .eq('id', id);
    if (error) throw error;
  }
}

export async function getTopic(id: string): Promise<TopicFull | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('topics')
    .select('*, subject:subjects(*), topic_facets(facets(*)), thoughts(*)')
    .eq('id', id)
    .maybeSingle<TopicWithSubjectFacetEmbed & { thoughts: Thought[] }>();
  if (error) throw error;
  if (!data) return null;
  const { topic_facets, subject, thoughts, ...topic } = data;
  return {
    ...topic,
    subject: subject as Subject,
    facets: flattenFacets(topic_facets),
    thoughts: (thoughts ?? []).slice().sort((a, b) => a.position - b.position),
  };
}

export async function createTopic(input: CreateTopicInput): Promise<Topic> {
  const supabase = await createClient();
  const user = await requireUser();
  const { data: last } = await supabase
    .from('topics')
    .select('position')
    .eq('subject_id', input.subjectId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (last?.position ?? -1) + 1;
  const { data, error } = await supabase
    .from('topics')
    .insert({
      title: input.title.trim(),
      subject_id: input.subjectId,
      user_id: user.id,
      position,
      is_group: input.isGroup ?? false,
      parent_topic_id: input.parentTopicId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  if (input.facetIds && input.facetIds.length > 0) {
    await setTopicFacets(data.id, input.facetIds);
  }
  return data;
}

export async function updateTopicTitle(id: string, title: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('topics').update({ title: title.trim() }).eq('id', id);
  if (error) throw error;
}

export async function deleteTopic(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('topics').delete().eq('id', id);
  if (error) throw error;
}

export async function spinRandomTopic(): Promise<Topic | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('topics').select('*').eq('is_group', false);
  if (error) throw error;
  if (!data || data.length === 0) return null;
  return data[Math.floor(Math.random() * data.length)];
}

export async function getRecentTopics(limit = 50): Promise<TopicWithSubjectAndFacets[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('topics')
    .select('*, subject:subjects(*), topic_facets(facets(*))')
    .eq('is_group', false)
    .order('created_at', { ascending: false })
    .limit(limit)
    .returns<TopicWithSubjectFacetEmbed[]>();
  if (error) throw error;
  return (data ?? []).map(toWithSubjectAndFacets);
}

/**
 * Keyword search across the user's wiki: matches topic titles, and topics
 * tagged with a facet whose name matches. Newest first. RLS scopes to the user.
 */
export async function searchTopics(query: string): Promise<TopicWithSubjectAndFacets[]> {
  const q = query.trim();
  if (!q) return [];
  const supabase = await createClient();
  // Escape LIKE wildcards so "50%" or "a_b" matches literally, not as a pattern.
  const pattern = `%${q.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
  const select = '*, subject:subjects(*), topic_facets(facets(*))';

  const { data: byTitle, error: titleErr } = await supabase
    .from('topics')
    .select(select)
    .eq('is_group', false)
    .ilike('title', pattern)
    .returns<TopicWithSubjectFacetEmbed[]>();
  if (titleErr) throw titleErr;

  let byFacet: TopicWithSubjectFacetEmbed[] = [];
  const { data: facetRows } = await supabase.from('facets').select('id').ilike('name', pattern);
  const facetIds = (facetRows ?? []).map((f) => f.id);
  if (facetIds.length > 0) {
    const { data: links } = await supabase
      .from('topic_facets')
      .select('topic_id')
      .in('facet_id', facetIds);
    const topicIds = Array.from(new Set((links ?? []).map((l) => l.topic_id)));
    if (topicIds.length > 0) {
      const { data, error } = await supabase
        .from('topics')
        .select(select)
        .eq('is_group', false)
        .in('id', topicIds)
        .returns<TopicWithSubjectFacetEmbed[]>();
      if (error) throw error;
      byFacet = data ?? [];
    }
  }

  const merged = new Map<string, TopicWithSubjectFacetEmbed>();
  for (const row of [...(byTitle ?? []), ...byFacet]) merged.set(row.id, row);
  return Array.from(merged.values())
    .map(toWithSubjectAndFacets)
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
}

/** Re-file a topic under a different subject, placing it at the end of the destination. */
export async function updateTopicSubject(id: string, subjectId: string): Promise<void> {
  const supabase = await createClient();
  const { data: last } = await supabase
    .from('topics')
    .select('position')
    .eq('subject_id', subjectId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (last?.position ?? -1) + 1;
  const { error } = await supabase
    .from('topics')
    .update({ subject_id: subjectId, position })
    .eq('id', id);
  if (error) throw error;
}
