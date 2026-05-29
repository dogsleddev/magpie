import { createClient, requireUser } from '@/lib/supabase/server';

export type CacheMode = 'brief' | 'challenge' | 'related' | 'questions';

export async function getCached(topicId: string, mode: CacheMode): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ai_cache')
    .select('content')
    .eq('topic_id', topicId)
    .eq('mode', mode)
    .maybeSingle();
  if (error) throw error;
  return data?.content ?? null;
}

export async function setCached(topicId: string, mode: CacheMode, content: string): Promise<void> {
  const supabase = await createClient();
  const user = await requireUser();
  const { error } = await supabase
    .from('ai_cache')
    .upsert(
      { topic_id: topicId, mode, content, user_id: user.id },
      { onConflict: 'topic_id,mode' },
    );
  if (error) throw error;
}

export async function clearCached(topicId: string, mode: CacheMode): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('ai_cache')
    .delete()
    .eq('topic_id', topicId)
    .eq('mode', mode);
  if (error) throw error;
}
