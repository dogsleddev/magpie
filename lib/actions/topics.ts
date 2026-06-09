'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/supabase/server';
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

async function categorize(idea: string, userId: string): Promise<CategorizeOutput> {
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
      userId,
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
  newTopicTitle: string,
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

  // ...or the new topic itself, when the user added the umbrella as a topic.
  const newTopicIsEntity = normalize(newTopicTitle) === entityNorm;

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
  } else if (newTopicIsEntity) {
    await promoteTopicToGroup(newTopicId);
    parentId = newTopicId;
    parentSubjectId = newSubjectId;
  } else {
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
  for (const name of names) {
    const clean = name.trim().toLowerCase();
    if (!clean) continue;
    const facet = await findOrCreateFacet(clean);
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
 * Pass a subjectId to pin the topic to a known subject (subject-page add).
 */
export async function addTopicViaMagpie(
  idea: string,
  options?: { subjectId?: string },
): Promise<AddTopicResult> {
  const { id: userId } = await requireUser();
  const trimmed = idea.trim();
  if (!trimmed) throw new Error('Tell Magpie an idea first.');

  const plan = isHighAgency(trimmed) ? { ...HIGH_AGENCY } : await categorize(trimmed, userId);

  let subjectId = options?.subjectId ?? (await resolveSubjectId(plan.subject));
  const facetIds = await resolveFacetIds(plan.facets);
  const topic = await createTopic({ title: plan.title, subjectId, facetIds });

  // Seed the first Thought with exactly what the user typed.
  try {
    await createThought(topic.id, trimmed);
  } catch (e) {
    console.error('[addTopic] failed to seed first thought:', e);
  }

  // The umbrella check. A grouping failure never breaks the add.
  try {
    const grouped = await applyUmbrella(plan.group, topic.id, topic.title, subjectId);
    if (grouped) subjectId = grouped.parentSubjectId;
  } catch (e) {
    console.error('[addTopic] umbrella grouping failed:', e);
  }

  const subjects = await getSubjectsWithCounts();
  const subjectName = subjects.find((s) => s.id === subjectId)?.name ?? plan.subject;

  revalidatePath('/app');
  revalidatePath('/recent');
  revalidatePath('/facets');
  revalidatePath('/nest');
  revalidatePath(`/subject/${subjectId}`);
  return { topicId: topic.id, title: topic.title, subjectId, subjectName, facets: plan.facets };
}

export async function moveTopicToSubject(topicId: string, subjectId: string): Promise<void> {
  await requireUser();
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
  await deleteTopic(topicId);
  revalidatePath('/app');
  revalidatePath('/recent');
  revalidatePath('/facets');
  revalidatePath('/nest');
}
