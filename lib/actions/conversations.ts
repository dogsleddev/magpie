'use server';

import { appendMessage } from '@/lib/queries/conversations';

/**
 * Persists Maggie's reply after the Convo stream finishes. The user message is
 * persisted server-side in the convo route before streaming; this saves the
 * assistant turn once the client has the full text.
 */
export async function saveAssistantMessage(topicId: string, content: string): Promise<void> {
  const trimmed = content.trim();
  if (!trimmed) return;
  await appendMessage(topicId, 'assistant', trimmed);
}
