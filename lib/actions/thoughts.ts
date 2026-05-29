'use server';

import { createThought, updateThought, deleteThought } from '@/lib/queries/thoughts';
import type { Thought } from '@/lib/queries/types';

export async function addThought(topicId: string, content: string): Promise<Thought> {
  return createThought(topicId, content);
}

export async function editThought(id: string, content: string): Promise<void> {
  await updateThought(id, content);
}

export async function removeThought(id: string): Promise<void> {
  await deleteThought(id);
}
