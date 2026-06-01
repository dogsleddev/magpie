'use server';

import { redirect } from 'next/navigation';
import { spinRandomTopic } from '@/lib/queries/topics';

export async function convoRoulette() {
  const topic = await spinRandomTopic();
  if (topic) redirect(`/topic/${topic.id}`);
  redirect('/app');
}
