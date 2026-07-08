import { createClient, requireUser } from '@/lib/supabase/server';
import type { Conversation, ConversationMessage } from './types';

export async function getConversation(topicId: string): Promise<Conversation | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('topic_id', topicId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Append several messages in one write (e.g. a user turn plus the assistant
 * reply together). Still read-modify-write, but the in-app UI serializes sends,
 * so the only realistic racer is two tabs on the same topic at once.
 */
export async function appendMessages(
  topicId: string,
  newMessages: ConversationMessage[],
): Promise<void> {
  if (newMessages.length === 0) return;
  const supabase = await createClient();
  const user = await requireUser();
  const existing = await getConversation(topicId);
  if (existing) {
    const current = existing.messages as unknown as ConversationMessage[];
    const { error } = await supabase
      .from('conversations')
      .update({ messages: [...current, ...newMessages] })
      .eq('id', existing.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from('conversations')
    .insert({ topic_id: topicId, user_id: user.id, messages: newMessages });
  if (error) {
    // 23505 = the unique(user_id, topic_id) row was created by a concurrent
    // first-turn insert (two tabs or two visitors on the same topic). Re-read and
    // append instead of throwing, so the just-streamed reply is not lost.
    if ((error as { code?: string }).code === '23505') {
      const now = await getConversation(topicId);
      if (now) {
        const current = now.messages as unknown as ConversationMessage[];
        const { error: updateErr } = await supabase
          .from('conversations')
          .update({ messages: [...current, ...newMessages] })
          .eq('id', now.id);
        if (updateErr) throw updateErr;
        return;
      }
    }
    throw error;
  }
}
