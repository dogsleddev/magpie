'use server';

import { createThought, updateThought, deleteThought } from '@/lib/queries/thoughts';
import type { Thought } from '@/lib/queries/types';

// Thoughts write to the shared DB but do not call the paid API, and capture is
// the core high-frequency loop (a whole meetup room can sit behind one venue IP),
// so we do NOT IP-throttle them. We only bound the stored length.
const MAX_THOUGHT_LEN = 10_000;

export async function addThought(topicId: string, content: string): Promise<Thought> {
  if (content.length > MAX_THOUGHT_LEN) throw new Error('That thought is too long.');
  return createThought(topicId, content);
}

export async function editThought(id: string, content: string): Promise<void> {
  if (content.length > MAX_THOUGHT_LEN) throw new Error('That thought is too long.');
  await updateThought(id, content);
}

export async function removeThought(id: string): Promise<void> {
  await deleteThought(id);
}
