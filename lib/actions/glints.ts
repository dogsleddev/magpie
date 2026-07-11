'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/supabase/server';
import { callClaude, MODELS } from '@/lib/ai/client';
import { shortTitlePrompt } from '@/lib/ai/prompts';
import { addTopicViaMagpie } from '@/lib/actions/topics';
import { findConnections, type Connection } from '@/lib/ai/connections';
import { getTopicsLite, setGlintSeed, updateTopicTitle } from '@/lib/queries/topics';
import {
  getActivityStrip,
  getStreak,
  getUserTimezone,
  markTodayActive,
  type ActivityDay,
  type Streak,
} from '@/lib/queries/activity';
import { logEvent } from '@/lib/queries/usage';

export type CaptureGlintResult = {
  topicId: string;
  title: string;
  connections: Connection[];
  streak: Streak;
  strip: ActivityDay[];
  // True when the glint was one already in the collection: we opened it instead
  // of creating a twin.
  alreadyHad: boolean;
};

// A glint stays in the user's own words. Only a genuinely long one gets a short
// name derived for it, with the full text kept as the Brief seed.
const GLINT_TITLE_MAX = 64;

/** Match key for spotting a re-catch: case, punctuation, and spacing folded away. */
function titleKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tidy a model-generated name down to at most 3 clean, lowercase words. */
function cleanShortTitle(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/^["'`\s]+|["'`.\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
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
 * Catch a glint: the Slice-0 daily action. A glint is a curiosity, so it enters
 * the graph as a topic and connects for free. The rules that keep it feeling like
 * yours:
 *   - Your words are the title. Only a glint longer than GLINT_TITLE_MAX gets a
 *     short derived name, with the full text seeding its Brief.
 *   - Catching one you already have opens it instead of making a twin. It still
 *     counts for the day.
 *   - The connection chips run in parallel with the create (against a pre-catch
 *     snapshot), so they land without waiting on the whole categorize chain.
 * One call; the client commits the input optimistically, so it feels instant.
 */
export async function captureGlint(input: string): Promise<CaptureGlintResult> {
  await requireUser();
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Catch a glint first.');
  if (trimmed.length > 2000) throw new Error('That is a bit long for a glint. Trim it and try again.');

  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const tz = await getUserTimezone();

  // Fetched once: the pre-catch snapshot both spots an exact re-catch and feeds
  // the connection match (which therefore never sees, or self-matches, the new topic).
  const existingTopics = await getTopicsLite();

  // C2: an exact re-catch (same words, ignoring case and punctuation) opens the
  // one you already have. Groups are buckets, not curiosities, so skip them.
  const key = titleKey(trimmed);
  const match = existingTopics.find((t) => !t.is_group && titleKey(t.title) === key);
  if (match) {
    await markTodayActive(tz);
    const [connections, streak, strip] = await Promise.all([
      findConnections(
        trimmed,
        existingTopics.filter((t) => t.id !== match.id),
      ),
      getStreak(tz),
      getActivityStrip(tz),
    ]);
    await logEvent('glint_caught', {
      topicId: match.id,
      words,
      connections: connections.length,
      alreadyHad: true,
    });
    revalidatePath('/home');
    return { topicId: match.id, title: match.title, connections, streak, strip, alreadyHad: true };
  }

  // A new catch. Keep the user's words unless the glint is very long.
  const isLong = trimmed.length > GLINT_TITLE_MAX;

  // Create, name, connect, and mark the day in parallel. Connections run against
  // the pre-catch snapshot, so the chips do not wait on categorize + create.
  const [added, derived, connections] = await Promise.all([
    addTopicViaMagpie(trimmed, isLong ? undefined : { titleOverride: trimmed }),
    isLong ? deriveShortTitle(trimmed) : Promise.resolve(''),
    findConnections(trimmed, existingTopics),
    markTodayActive(tz),
  ]);

  const title = isLong ? derived || trimmed : trimmed;

  // A short glint was already created titled with the user's words. A long one
  // keeps its derived name here, with the raw words seeding the Brief.
  try {
    if (isLong) await updateTopicTitle(added.topicId, title);
    await setGlintSeed(added.topicId, { rawInput: trimmed, briefSeed: isLong ? trimmed : null });
  } catch (e) {
    console.error('[captureGlint] title/seed update failed:', e);
  }

  const [streak, strip] = await Promise.all([getStreak(tz), getActivityStrip(tz)]);

  await logEvent('glint_caught', {
    topicId: added.topicId,
    words,
    connections: connections.length,
  });

  revalidatePath('/home');
  return { topicId: added.topicId, title, connections, streak, strip, alreadyHad: false };
}
