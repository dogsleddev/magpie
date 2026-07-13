'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/supabase/server';
import { callClaude, MODELS } from '@/lib/ai/client';
import { shortTitlePrompt } from '@/lib/ai/prompts';
import { addTopicViaMagpie, type NestSuggestion } from '@/lib/actions/topics';
import { findConnections, type Connection } from '@/lib/ai/connections';
import { getSharedEntityConnections, getTopicEntities } from '@/lib/queries/entities';
import {
  deleteTopic,
  getTopicsLite,
  setGlintSeed,
  updateTopicTitle,
  type TopicLite,
} from '@/lib/queries/topics';
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
  // The entity hubs this glint is about, shown as the editable "about" line.
  entities: { id: string; name: string }[];
  // Broader hubs Maggie proposed that do not exist yet: one-tap accepts.
  nestSuggestions: NestSuggestion[];
  // The distinct curiosities Maggie spotted in a brain-dump (2 to 3 short glint
  // texts), or null. When present, the caught card offers to split.
  split: string[] | null;
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

/**
 * The connection engine for a caught glint: honest shared-hub matches first
 * ("both about wolves"), falling back to the fuzzy title match on a cold graph
 * so a chip still lands. Shared by the re-catch and new-catch paths.
 */
async function connectionsFor(
  glint: string,
  topicId: string,
  entityIds: string[],
  fallbackTopics: TopicLite[],
): Promise<Connection[]> {
  const shared = await getSharedEntityConnections(topicId, entityIds);
  return shared.length > 0 ? shared : findConnections(glint, fallbackTopics);
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
 *   - Connections are honest: other glints that share an extracted entity hub
 *     ("both about wolves"). When nothing shares a hub yet (a cold graph), it
 *     falls back to the fuzzy title match so a chip still lands.
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
    const matchEntities = await getTopicEntities(match.id);
    const connections = await connectionsFor(
      trimmed,
      match.id,
      matchEntities.map((e) => e.id),
      existingTopics.filter((t) => t.id !== match.id),
    );
    const [streak, strip] = await Promise.all([getStreak(tz), getActivityStrip(tz)]);
    await logEvent('glint_caught', {
      topicId: match.id,
      words,
      connections: connections.length,
      alreadyHad: true,
    });
    revalidatePath('/home');
    revalidatePath('/library');
    return {
      topicId: match.id,
      title: match.title,
      connections,
      streak,
      strip,
      entities: matchEntities.map((e) => ({ id: e.id, name: e.name })),
      nestSuggestions: [],
      split: null,
      alreadyHad: true,
    };
  }

  // A new catch. Keep the user's words unless the glint is very long.
  const isLong = trimmed.length > GLINT_TITLE_MAX;

  // Create + name + mark the day. Entity extraction and linking happen inside
  // addTopicViaMagpie, so its result carries the resolved hubs.
  const [added, derived] = await Promise.all([
    addTopicViaMagpie(trimmed, isLong ? undefined : { titleOverride: trimmed }),
    isLong ? deriveShortTitle(trimmed) : Promise.resolve(''),
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

  const connections = await connectionsFor(
    trimmed,
    added.topicId,
    added.entities.map((e) => e.id),
    existingTopics,
  );

  const [streak, strip] = await Promise.all([getStreak(tz), getActivityStrip(tz)]);

  const splitGlints = (added.split ?? [])
    .map((s) => (typeof s?.glint === 'string' ? s.glint.trim() : ''))
    .filter(Boolean);

  await logEvent('glint_caught', {
    topicId: added.topicId,
    words,
    connections: connections.length,
    split: splitGlints.length >= 2,
  });

  revalidatePath('/home');
  revalidatePath('/library');
  return {
    topicId: added.topicId,
    title,
    connections,
    streak,
    strip,
    entities: added.entities.map((e) => ({ id: e.id, name: e.name })),
    nestSuggestions: added.nestSuggestions,
    split: splitGlints.length >= 2 ? splitGlints : null,
    alreadyHad: false,
  };
}

/**
 * Split a caught brain-dump into separate glints. Each text is filed as its own
 * glint through the shared add flow (so it gets a subject, facets, and entity
 * hubs, keeping the user's words), then the original combined topic is removed.
 * The day was already marked on the original catch, so this creates topics only:
 * one catch stays one streak tick.
 */
export async function splitGlint(
  originalTopicId: string,
  glints: string[],
): Promise<{ id: string; title: string }[]> {
  await requireUser();
  const texts = glints.map((g) => g.trim()).filter(Boolean).slice(0, 5);
  if (texts.length < 2) throw new Error('Nothing to split.');

  const created: { id: string; title: string }[] = [];
  for (const text of texts) {
    const added = await addTopicViaMagpie(text, { titleOverride: text });
    try {
      await setGlintSeed(added.topicId, { rawInput: text, briefSeed: null });
    } catch (e) {
      console.error('[splitGlint] seed failed:', e);
    }
    created.push({ id: added.topicId, title: added.title });
  }

  try {
    await deleteTopic(originalTopicId);
  } catch (e) {
    console.error('[splitGlint] delete original failed:', e);
  }

  revalidatePath('/home');
  revalidatePath('/app');
  revalidatePath('/library');
  return created;
}
