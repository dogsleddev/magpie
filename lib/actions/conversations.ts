'use server';

import { appendMessages } from '@/lib/queries/conversations';
import type { ConversationMessage } from '@/lib/queries/types';

/**
 * Persist a completed Convo exchange (the user turn + Maggie's reply) together,
 * only after a clean stream. Saving both at once means an aborted or failed
 * stream never leaves a dangling user turn (which would 400 the next call) and
 * never writes an error note as a real assistant turn.
 */
export async function saveConvoTurn(
  topicId: string,
  userMessage: string,
  assistantMessage: string,
): Promise<void> {
  // The paid work (the stream) is already limited at the AI route; this is just
  // the cheap DB write that records the finished turn. Throttling it too would
  // double-limit a legit chat and, behind a shared meetup IP, drop real replies.
  const user = userMessage.trim();
  const assistant = assistantMessage.trim();
  if (!user || !assistant) return;
  const turns: ConversationMessage[] = [
    { role: 'user', content: user },
    { role: 'assistant', content: assistant },
  ];
  await appendMessages(topicId, turns);
}
