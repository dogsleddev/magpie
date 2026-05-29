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

export async function appendMessage(
  topicId: string,
  role: 'user' | 'assistant',
  content: string,
): Promise<void> {
  const supabase = await createClient();
  const user = await requireUser();
  const existing = await getConversation(topicId);
  const message: ConversationMessage = { role, content };

  if (existing) {
    // messages is stored as Json; it is always an array of ConversationMessage.
    const current = existing.messages as unknown as ConversationMessage[];
    const { error } = await supabase
      .from('conversations')
      .update({ messages: [...current, message] })
      .eq('id', existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('conversations')
    .insert({ topic_id: topicId, user_id: user.id, messages: [message] });
  if (error) throw error;
}
