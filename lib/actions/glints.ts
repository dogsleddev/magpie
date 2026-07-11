'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/supabase/server';
import { callClaude, MODELS } from '@/lib/ai/client';
import { shortTitlePrompt } from '@/lib/ai/prompts';
import { addTopicViaMagpie } from '@/lib/actions/topics';
import { findConnections, type Connection } from '@/lib/ai/connections';
import { setGlintSeed, updateTopicTitle } from '@/lib/queries/topics';
import { getStreak, getUserTimezone, markTodayActive, type Streak } from '@/lib/queries/activity';
import { logEvent } from '@/lib/queries/usage';

export type CaptureGlintResult = {
  topicId: string;
  title: string;
  connections: Connection[];
  streak: Streak;
};

/** Tidy a model-generated name down to at most 3 clean words. */
function cleanShortTitle(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/^["'`\s]+|["'`.\s]+$/g, '')
    .replace(/\s+/g, ' ');
  return cleaned.split(' ').slice(0, 3).join(' ');
}

/** Derive a 1 to 3 word name for a long glint. Empty string on failure. */
async function deriveShortTitle(text: string): Promise<string> {
  try {
    const p = shortTitlePrompt(text);
    const raw = await callClaude({
      model: MODELS.haiku,
      system: p.system,
      user: p.user,
      maxTokens: 24,
    });
    return cleanShortTitle(raw);
  } catch {
    return '';
  }
}

/**
 * Catch a glint: the Slice-0 daily action. A glint is a curiosity, so this
 * reuses the mature add flow to file it (subject, facets, grouping), then the
 * record gets a 1 to 3 word name: 3 words or fewer, the input is the name; more
 * than 3, Maggie derives a short name and the input seeds the Brief. Finds the
 * connections and marks the streak. One call; the client commits the input
 * optimistically, so it feels instant, then the connection chips land a beat later.
 */
export async function captureGlint(input: string): Promise<CaptureGlintResult> {
  await requireUser();
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Catch a glint first.');
  if (trimmed.length > 2000) throw new Error('That is a bit long for a glint. Trim it and try again.');

  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const needsShort = words > 3;

  // File the curiosity and, in parallel when the glint runs long, derive its name.
  const [added, derived] = await Promise.all([
    addTopicViaMagpie(trimmed),
    needsShort ? deriveShortTitle(trimmed) : Promise.resolve(''),
  ]);
  const title = needsShort ? derived || added.title : trimmed;

  // Override the categorizer's long title with the 1 to 3 word name, and keep the
  // raw words (seeding the Brief only when the glint is more than 3 words).
  try {
    await updateTopicTitle(added.topicId, title);
    await setGlintSeed(added.topicId, {
      rawInput: trimmed,
      briefSeed: needsShort ? trimmed : null,
    });
  } catch (e) {
    console.error('[captureGlint] title/seed update failed:', e);
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
  return { topicId: added.topicId, title, connections, streak };
}
