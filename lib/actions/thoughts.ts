'use server';

import { createThought, updateThought, deleteThought } from '@/lib/queries/thoughts';
import { limitAction } from '@/lib/rate-limit-server';
import type { Thought } from '@/lib/queries/types';

// Thoughts write to the shared DB from a one-click public login, so throttle by
// IP (generous: capture is high-frequency, but a script cannot bloat the grid)
// and bound the stored length.
const MAX_THOUGHT_LEN = 10_000;

export async function addThought(topicId: string, content: string): Promise<Thought> {
  await limitAction('thought', 60);
  if (content.length > MAX_THOUGHT_LEN) throw new Error('That thought is too long.');
  return createThought(topicId, content);
}

export async function editThought(id: string, content: string): Promise<void> {
  await limitAction('thought', 60);
  if (content.length > MAX_THOUGHT_LEN) throw new Error('That thought is too long.');
  await updateThought(id, content);
}

export async function removeThought(id: string): Promise<void> {
  await limitAction('thought', 60);
  await deleteThought(id);
}
