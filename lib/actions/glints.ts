'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/supabase/server';
import { addTopicViaMagpie } from '@/lib/actions/topics';
import { findConnections, type Connection } from '@/lib/ai/connections';
import { setGlintSeed } from '@/lib/queries/topics';
import { getStreak, getUserTimezone, markTodayActive, type Streak } from '@/lib/queries/activity';
import { logEvent } from '@/lib/queries/usage';

export type CaptureGlintResult = {
  topicId: string;
  title: string;
  connections: Connection[];
  streak: Streak;
};

/**
 * Catch a glint: the Slice-0 daily action. A glint is a curiosity, so this
 * reuses the mature add flow to create and file it, stores the raw input (and a
 * Brief seed when the glint runs long), finds its connections, and marks the
 * streak. One call; the client commits the input optimistically so it feels
 * instant, then shows the connection chips a beat later.
 */
export async function captureGlint(input: string): Promise<CaptureGlintResult> {
  await requireUser();
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Catch a glint first.');
  if (trimmed.length > 2000) throw new Error('That is a bit long for a glint. Trim it and try again.');

  const words = trimmed.split(/\s+/).filter(Boolean).length;

  // A glint IS a curiosity: create and file it through the existing add flow.
  const added = await addTopicViaMagpie(trimmed);

  // Keep the raw words, and seed the Brief when the glint is more than 3 words.
  try {
    await setGlintSeed(added.topicId, {
      rawInput: trimmed,
      briefSeed: words > 3 ? trimmed : null,
    });
  } catch (e) {
    console.error('[captureGlint] setGlintSeed failed:', e);
  }

  const tz = await getUserTimezone();
  const [connections] = await Promise.all([
    findConnections(trimmed, added.topicId),
    markTodayActive(tz),
  ]);
  const streak = await getStreak(tz);

  await logEvent('glint_caught', {
    topicId: added.topicId,
    words,
    connections: connections.length,
  });

  revalidatePath('/home');
  return { topicId: added.topicId, title: added.title, connections, streak };
}
