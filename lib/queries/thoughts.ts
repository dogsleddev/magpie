import { createClient, requireUser } from '@/lib/supabase/server';
import type { Thought, Topic, TopicWithThoughts } from './types';

export async function getThoughtsForTopic(topicId: string): Promise<Thought[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('thoughts')
    .select('*')
    .eq('topic_id', topicId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getAllThoughtsGrouped(): Promise<TopicWithThoughts[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('topics')
    .select('*, thoughts(*)')
    .order('created_at', { ascending: false })
    .returns<(Topic & { thoughts: Thought[] })[]>();
  if (error) throw error;
  return (data ?? [])
    .map(({ thoughts, ...topic }) => ({
      ...topic,
      thoughts: (thoughts ?? []).slice().sort((a, b) => a.position - b.position),
    }))
    .filter((topic) => topic.thoughts.length > 0);
}

export async function createThought(topicId: string, content: string): Promise<Thought> {
  const supabase = await createClient();
  const user = await requireUser();
  const { data: last } = await supabase
    .from('thoughts')
    .select('position')
    .eq('topic_id', topicId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (last?.position ?? -1) + 1;
  const { data, error } = await supabase
    .from('thoughts')
    .insert({ topic_id: topicId, content: content.trim(), user_id: user.id, position })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateThought(id: string, content: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('thoughts')
    .update({ content: content.trim() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteThought(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('thoughts').delete().eq('id', id);
  if (error) throw error;
}
