'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/supabase/server';
import { limitAction } from '@/lib/rate-limit-server';
import { callClaude, MODELS } from '@/lib/ai/client';
import {
  categorizeTopicPrompt,
  extractJSON,
  type CategorizeGroup,
  type CategorizeOutput,
} from '@/lib/ai/prompts';
import {
  adoptTopicsUnderGroup,
  createTopic,
  deleteTopic,
  getTopicsLite,
  promoteTopicToGroup,
  spinRandomTopic,
  updateTopicSubject,
  type TopicLite,
} from '@/lib/queries/topics';
import { createThought } from '@/lib/queries/thoughts';
import { createSubject, getSubjectsWithCounts } from '@/lib/queries/subjects';
import { findOrCreateFacet, getFacetsWithCounts, setTopicFacets } from '@/lib/queries/facets';

// Deterministic demo anchor: "High Agency" always files the same way on stage.
const HIGH_AGENCY: CategorizeOutput = {
  title: 'High Agency',
  subject: 'Psychology & Behavior',
  facets: ['skills', 'challenges'],
  group: null,
};

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function isHighAgency(idea: string): boolean {
  return /\bhigh[-\s]?agency\b/.test(normalize(idea));
}

async function categorize(idea: string): Promise<CategorizeOutput> {
  const [subjects, facets, topics] = await Promise.all([
    getSubjectsWithCounts(),
    getFacetsWithCounts(),
    getTopicsLite(),
  ]);
  const prompt = categorizeTopicPrompt(
    idea,
    subjects.map((s) => s.name),
    facets.map((f) => f.name),
    topics.map((t) => t.title),
  );
  let parsed: CategorizeOutput | null = null;
  try {
    const raw = await callClaude({
      model: MODELS.haiku,
      system: prompt.system,
      user: prompt.user,
      maxTokens: 512,
    });
    parsed = extractJSON<CategorizeOutput>(raw);
  } catch {
    parsed = null;
  }
  const rawGroup = parsed?.group;
  const group: CategorizeGroup | null =
    rawGroup && typeof rawGroup.name === 'string' && rawGroup.name.trim()
      ? {
          name: rawGroup.name.trim(),
          members: Array.isArray(rawGroup.members)
            ? rawGroup.members.filter((m): m is string => typeof m === 'string' && !!m.trim())
            : [],
        }
      : null;
  return {
    title: parsed?.title?.trim() || idea,
    subject: parsed?.subject?.trim() || 'Ideas',
    facets: Array.isArray(parsed?.facets)
      ? parsed!.facets
          .map((f) => f.trim())
          .filter(Boolean)
          .slice(0, 3)
      : [],
    group,
  };
}

/**
 * The umbrella check: when the categorizer says the new topic shares a named
 * entity (series, team, show, franchise) with existing topics, nest them all
 * under one group parent. Finds or creates the parent (promoting an existing
 * topic when it IS the entity), adopts only parentless non-group topics, and
 * children follow the parent's subject. Conservative: no members, no group.
 */
async function applyUmbrella(
  group: CategorizeGroup | null | undefined,
  newTopicId: string,
  newSubjectId: string,
): Promise<{ parentId: string; parentSubjectId: string } | null> {
  if (!group?.name) return null;

  const all = await getTopicsLite();
  const byNorm = new Map<string, TopicLite[]>();
  for (const t of all) {
    const k = normalize(t.title);
    byNorm.set(k, [...(byNorm.get(k) ?? []), t]);
  }

  const entityNorm = normalize(group.name);
  // The parent: an existing topic titled exactly as the entity (prefer a group)...
  const parentCandidates = (byNorm.get(entityNorm) ?? [])
    .filter((t) => t.id !== newTopicId && !t.parent_topic_id)
    .sort((a, b) => Number(b.is_group) - Number(a.is_group));
  let parent = parentCandidates[0] ?? null;

  // Adoptable members: exact-title matches that are parentless non-groups.
  const memberIds = new Set<string>();
  for (const m of group.members) {
    for (const t of byNorm.get(normalize(m)) ?? []) {
      if (t.id === newTopicId || t.id === parent?.id) continue;
      if (t.is_group || t.parent_topic_id) continue;
      memberIds.add(t.id);
    }
  }

  // Never build a group around nothing: need an existing parent to slot into,
  // or at least one existing member to sit alongside.
  if (!parent && memberIds.size === 0) return null;

  let parentId: string;
  let parentSubjectId: string;
  if (parent) {
    if (!parent.is_group) await promoteTopicToGroup(parent.id);
    parentId = parent.id;
    parentSubjectId = parent.subject_id;
  } else {
    // No existing parent (including when the new topic itself is the entity):
    // create a separate group anchor and adopt the new topic as a child. We do
    // NOT promote the new topic, because createThought already seeded the user's
    // idea onto it, and a group anchor renders no thoughts, so promoting it would
    // hide that idea.
    const created = await createTopic({
      title: group.name,
      subjectId: newSubjectId,
      facetIds: [],
      isGroup: true,
    });
    parentId = created.id;
    parentSubjectId = newSubjectId;
  }

  const childIds = [...memberIds];
  if (parentId !== newTopicId) childIds.unshift(newTopicId);
  await adoptTopicsUnderGroup(parentId, parentSubjectId, childIds);
  return { parentId, parentSubjectId };
}

async function resolveSubjectId(name: string): Promise<string> {
  const subjects = await getSubjectsWithCounts();
  const match = subjects.find((s) => normalize(s.name) === normalize(name));
  if (match) return match.id;
  const created = await createSubject(name);
  return created.id;
}

async function resolveFacetIds(names: string[]): Promise<string[]> {
  const ids: string[] = [];
  const seenNames = new Set<string>();
  const seenIds = new Set<string>();
  for (const name of names) {
    const clean = name.trim().toLowerCase();
    // Dedupe by name (a repeat or case-variant like "AI"/"ai") and again by id
    // (two names collapsing to one existing facet), so a topic never links the
    // same facet twice and hits the topic_facets primary-key violation.
    if (!clean || seenNames.has(clean)) continue;
    seenNames.add(clean);
    const facet = await findOrCreateFacet(clean);
    if (seenIds.has(facet.id)) continue;
    seenIds.add(facet.id);
    ids.push(facet.id);
  }
  return ids;
}

export type AddTopicResult = {
  topicId: string;
  title: string;
  subjectId: string;
  subjectName: string;
  facets: string[];
};

/**
 * "Talk to Magpie to add a topic." Sends the idea through Claude to pick a
 * subject and facets, then creates the topic. Falls back to a raw create if
 * the model is unavailable. "High Agency" is forced for a reliable demo.
 * Pass a subjectId to pin the topic to a known subject (subject-page add), and
 * a parentTopicId to file it as a sub-topic inside a group (group-page add).
 */
export async function addTopicViaMagpie(
  idea: string,
  options?: { subjectId?: string; parentTopicId?: string },
): Promise<AddTopicResult> {
  await requireUser();
  const trimmed = idea.trim();
  if (!trimmed) throw new Error('Tell Magpie an idea first.');
  if (trimmed.length > 2000) throw new Error('That idea is a bit long. Trim it and try again.');

  // Server Actions bypass the /api/ai middleware limiter, so cap the mutating
  // ones by client IP here. This one calls Claude (categorize) and writes to the
  // shared DB. (A shared event NAT may put a room behind one IP; 30/min is
  // generous for humans, tight enough to stop a bot.)
  await limitAction('add', 30);

  const plan = isHighAgency(trimmed) ? { ...HIGH_AGENCY } : await categorize(trimmed);

  let subjectId = options?.subjectId ?? (await resolveSubjectId(plan.subject));
  const facetIds = await resolveFacetIds(plan.facets);
  const topic = await createTopic({
    title: plan.title,
    subjectId,
    facetIds,
    parentTopicId: options?.parentTopicId ?? null,
  });

  // Seed the first Thought with exactly what the user typed.
  try {
    await createThought(topic.id, trimmed);
  } catch (e) {
    console.error('[addTopic] failed to seed first thought:', e);
  }

  // The umbrella check. A grouping failure never breaks the add. Skipped when
  // the user filed the topic into a group explicitly: that placement wins.
  if (!options?.parentTopicId) {
    try {
      const grouped = await applyUmbrella(plan.group, topic.id, subjectId);
      if (grouped) subjectId = grouped.parentSubjectId;
    } catch (e) {
      console.error('[addTopic] umbrella grouping failed:', e);
    }
  }

  const subjects = await getSubjectsWithCounts();
  const subjectName = subjects.find((s) => s.id === subjectId)?.name ?? plan.subject;

  revalidatePath('/app');
  revalidatePath('/recent');
  revalidatePath('/facets');
  revalidatePath('/nest');
  revalidatePath(`/subject/${subjectId}`);
  if (options?.parentTopicId) revalidatePath(`/topic/${options.parentTopicId}`);
  return { topicId: topic.id, title: topic.title, subjectId, subjectName, facets: plan.facets };
}

export async function moveTopicToSubject(topicId: string, subjectId: string): Promise<void> {
  await requireUser();
  await limitAction('move', 60);
  await updateTopicSubject(topicId, subjectId);
  revalidatePath('/recent');
  revalidatePath('/app');
  revalidatePath('/facets');
  revalidatePath('/nest');
  revalidatePath(`/subject/${subjectId}`);
  revalidatePath(`/topic/${topicId}`);
}

export async function updateTopicFacetsByName(topicId: string, names: string[]): Promise<void> {
  await requireUser();
  await limitAction('facets', 60);
  const ids = await resolveFacetIds(names);
  await setTopicFacets(topicId, ids);
  revalidatePath('/recent');
  revalidatePath('/facets');
  revalidatePath('/nest');
  revalidatePath(`/topic/${topicId}`);
}

/**
 * Rediscover: spin to a random topic in the wiki (the old roulette). Lands on
 * its topic page; falls back to the grid if the wiki is empty.
 */
export async function rediscover(): Promise<void> {
  const topic = await spinRandomTopic();
  redirect(topic ? `/topic/${topic.id}` : '/app');
}

/** Delete a topic. Backs the quiet delete control on the topic page. */
export async function deleteTopicById(topicId: string): Promise<void> {
  await requireUser();
  // Destructive and cascading (thoughts + conversations). On the shared account
  // topic ids are enumerable, so keep this budget tight: a mass-delete loop is
  // slowed to a crawl and stays visible instead of wiping the grid in seconds.
  await limitAction('delete', 10);
  const deleted = await deleteTopic(topicId);
  revalidatePath('/app');
  revalidatePath('/recent');
  revalidatePath('/facets');
  revalidatePath('/nest');
  if (deleted) {
    // The delete control redirects to the subject page; revalidate it (and the
    // parent group page for a sub-topic) so the removed topic does not linger there.
    revalidatePath(`/subject/${deleted.subject_id}`);
    if (deleted.parent_topic_id) revalidatePath(`/topic/${deleted.parent_topic_id}`);
  }
}
