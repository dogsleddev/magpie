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
