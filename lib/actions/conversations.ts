'use server';

import { appendMessages } from '@/lib/queries/conversations';
import { limitAction } from '@/lib/rate-limit-server';
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
  // Mutating write to the shared conversations table, directly callable, so
  // throttle it like the other mutating actions (the stream call is already
  // limited, this covers a direct save loop).
  await limitAction('convo-save', 60);
  const user = userMessage.trim();
  const assistant = assistantMessage.trim();
  if (!user || !assistant) return;
  const turns: ConversationMessage[] = [
    { role: 'user', content: user },
    { role: 'assistant', content: assistant },
  ];
  await appendMessages(topicId, turns);
}
