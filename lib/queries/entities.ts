import { createClient, requireUser } from '@/lib/supabase/server';
import type { Connection } from '@/lib/ai/connections';

// The 0009 entity tables are not yet in the generated Database types, so these
// calls use the same narrow cast the 0008 activity queries use. Regenerate
// lib/supabase/types.ts once a DB connection is available and drop the casts.
type Db = { from: (t: string) => any };

export type EntityLite = { id: string; name: string; canonical_key: string };

// Lens/angle words are facets, never entities. Belt-and-suspenders behind the
// extractor prompt, which is already told not to return these.
const LENS = new Set([
  'paradox', 'philosophy', 'fun facts', 'counterintuitive', 'thought experiment',
  'history', 'discoveries', 'discovery', 'ethics', 'future', 'evolution', 'trends',
  'skills', 'convergent', 'challenges', 'forgotten', 'dystopia', 'extremes',
  'predictions', 'irony', 'tradeoff', 'cause and effect',
]);
const VACUOUS = new Set([
  'life', 'things', 'thing', 'the world', 'world', 'stuff', 'people', 'society', 'ideas',
]);

/** Fold case, punctuation, spacing, and a leading "the" so variants collapse to one hub. */
export function entityKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/^the\s+/, '')
    .trim();
}

/** True when a name is a real entity noun, not a lens word or vacuous filler. */
export function isEntityLike(name: string): boolean {
  const k = entityKey(name);
  return !!k && k.length <= 60 && !LENS.has(k) && !VACUOUS.has(k);
}

/** Every entity hub the user owns (for prompt-time reuse and resolution). */
export async function getEntitiesLite(): Promise<EntityLite[]> {
  const supabase = (await createClient()) as unknown as Db;
  const user = await requireUser();
  const { data } = await supabase
    .from('entities')
    .select('id, name, canonical_key')
    .eq('user_id', user.id);
  return (data ?? []) as EntityLite[];
}

/**
 * Find the canonical hub for a name or create it. Mirrors findOrCreateFacet,
 * including the 23505 re-read: under the shared account a concurrent catch may
 * create the same hub first, so reuse it instead of failing the whole catch.
 * Matches on canonical_key, then on a recorded alias, before inserting.
 */
export async function findOrCreateEntity(name: string): Promise<EntityLite> {
  const supabase = (await createClient()) as unknown as Db;
  const user = await requireUser();
  const clean = name.trim();
  const key = entityKey(clean);
  if (!key) throw new Error('empty entity name');

  const { data: hit } = await supabase
    .from('entities')
    .select('id, name, canonical_key')
    .eq('user_id', user.id)
    .eq('canonical_key', key)
    .maybeSingle();
  if (hit) return hit as EntityLite;

  const { data: alias } = await supabase
    .from('entity_aliases')
    .select('entity_id')
    .eq('user_id', user.id)
    .eq('alias_key', key)
    .maybeSingle();
  if (alias?.entity_id) {
    const { data: viaAlias } = await supabase
      .from('entities')
      .select('id, name, canonical_key')
      .eq('id', alias.entity_id)
      .maybeSingle();
    if (viaAlias) return viaAlias as EntityLite;
  }

  const { data: created, error } = await supabase
    .from('entities')
    .insert({ user_id: user.id, name: clean, canonical_key: key })
    .select('id, name, canonical_key')
    .single();
  if (error) {
    if ((error as { code?: string }).code === '23505') {
      const { data: raced } = await supabase
        .from('entities')
        .select('id, name, canonical_key')
        .eq('user_id', user.id)
        .eq('canonical_key', key)
        .maybeSingle();
      if (raced) return raced as EntityLite;
    }
    throw error;
  }
  return created as EntityLite;
}

/** Link a glint to an entity hub. Idempotent (the PK makes re-links a no-op). */
export async function linkTopicEntity(topicId: string, entityId: string): Promise<void> {
  const supabase = (await createClient()) as unknown as Db;
  const { error } = await supabase
    .from('topic_entities')
    .upsert(
      { topic_id: topicId, entity_id: entityId },
      { onConflict: 'topic_id,entity_id', ignoreDuplicates: true },
    );
  if (error) throw error;
}

/** Remove one entity from one glint. The hub itself survives. */
export async function unlinkTopicEntity(topicId: string, entityId: string): Promise<void> {
  const supabase = (await createClient()) as unknown as Db;
  const { error } = await supabase
    .from('topic_entities')
    .delete()
    .eq('topic_id', topicId)
    .eq('entity_id', entityId);
  if (error) throw error;
}

/** The entities linked to one glint. */
export async function getTopicEntities(topicId: string): Promise<EntityLite[]> {
  const supabase = (await createClient()) as unknown as Db;
  const { data } = await supabase
    .from('topic_entities')
    .select('entities(id, name, canonical_key)')
    .eq('topic_id', topicId);
  return ((data ?? []) as { entities: EntityLite | null }[])
    .map((r) => r.entities)
    .filter((e): e is EntityLite => !!e);
}

/**
 * Nest one entity under a broader one, guarding against cycles: walk the proposed
 * parent's ancestors first and refuse if the child is among them (the DB check
 * only blocks self-loops). Silent no-op on a cycle or a duplicate edge.
 */
export async function addEntityParent(childId: string, parentId: string): Promise<void> {
  if (childId === parentId) return;
  const supabase = (await createClient()) as unknown as Db;

  const seen = new Set<string>([parentId]);
  let frontier = [parentId];
  while (frontier.length) {
    const { data } = await supabase
      .from('entity_parents')
      .select('parent_entity_id')
      .in('child_entity_id', frontier);
    const next: string[] = [];
    for (const row of (data ?? []) as { parent_entity_id: string }[]) {
      const p = row.parent_entity_id;
      if (p === childId) return; // adding this edge would close a cycle
      if (!seen.has(p)) {
        seen.add(p);
        next.push(p);
      }
    }
    frontier = next;
  }

  const { error } = await supabase
    .from('entity_parents')
    .upsert(
      { child_entity_id: childId, parent_entity_id: parentId },
      { onConflict: 'child_entity_id,parent_entity_id', ignoreDuplicates: true },
    );
  if (error) throw error;
}

/**
 * The connection engine's honest path: other glints that share an entity hub with
 * this one. Deterministic, explainable ("both about wolves"), no model call.
 * Returns at most 2, one per distinct topic, excluding group anchors and self.
 */
export async function getSharedEntityConnections(
  topicId: string,
  entityIds: string[],
): Promise<Connection[]> {
  if (entityIds.length === 0) return [];
  const supabase = (await createClient()) as unknown as Db;
  const { data } = await supabase
    .from('topic_entities')
    .select('topic_id, topics(title, is_group), entities(name)')
    .in('entity_id', entityIds)
    .neq('topic_id', topicId);

  const seen = new Set<string>();
  const out: Connection[] = [];
  for (const row of (data ?? []) as {
    topic_id: string;
    topics: { title: string; is_group: boolean } | null;
    entities: { name: string } | null;
  }[]) {
    if (!row.topics || row.topics.is_group) continue;
    if (seen.has(row.topic_id)) continue;
    seen.add(row.topic_id);
    out.push({
      title: row.topics.title,
      why: row.entities?.name ? `both about ${row.entities.name}` : 'a shared thread',
      topicId: row.topic_id,
    });
    if (out.length === 2) break;
  }
  return out;
}

/** Hubs with their glint counts, richest first. Backs the Library and verification. */
export async function getEntityRollup(): Promise<{ id: string; name: string; count: number }[]> {
  const supabase = (await createClient()) as unknown as Db;
  const user = await requireUser();
  const { data } = await supabase
    .from('entities')
    .select('id, name, topic_entities(count)')
    .eq('user_id', user.id);
  return ((data ?? []) as { id: string; name: string; topic_entities: { count: number }[] }[])
    .map((e) => ({ id: e.id, name: e.name, count: e.topic_entities?.[0]?.count ?? 0 }))
    .sort((a, b) => b.count - a.count);
}

export type HubRow = {
  id: string;
  name: string;
  count: number;
  preview: string[];
  children: string[]; // narrower entities that nest under this hub
};

/**
 * The Library's Hubs lens: every entity that gathers at least `minCount` glints,
 * richest first, each with a short preview of its glint titles and the narrower
 * hubs nested under it. One pass over the join, plus one over the nesting edges.
 */
export async function getHubRollup(minCount = 2): Promise<HubRow[]> {
  const supabase = (await createClient()) as unknown as Db;
  const user = await requireUser();

  const [{ data: ents }, { data: edges }] = await Promise.all([
    supabase
      .from('entities')
      .select('id, name, topic_entities(topics(title, is_group))')
      .eq('user_id', user.id),
    supabase.from('entity_parents').select('child_entity_id, parent_entity_id'),
  ]);

  const nameById = new Map(
    ((ents ?? []) as { id: string; name: string }[]).map((e) => [e.id, e.name]),
  );
  const childrenOf = new Map<string, string[]>();
  for (const e of (edges ?? []) as { child_entity_id: string; parent_entity_id: string }[]) {
    const childName = nameById.get(e.child_entity_id);
    if (!childName) continue;
    childrenOf.set(e.parent_entity_id, [...(childrenOf.get(e.parent_entity_id) ?? []), childName]);
  }

  const rows: HubRow[] = ((ents ?? []) as {
    id: string;
    name: string;
    topic_entities: { topics: { title: string; is_group: boolean } | null }[];
  }[]).map((e) => {
    const titles = (e.topic_entities ?? [])
      .map((te) => te.topics)
      .filter((t): t is { title: string; is_group: boolean } => !!t && !t.is_group)
      .map((t) => t.title);
    return {
      id: e.id,
      name: e.name,
      count: titles.length,
      preview: titles.slice(0, 2),
      children: childrenOf.get(e.id) ?? [],
    };
  });

  return rows.filter((r) => r.count >= minCount).sort((a, b) => b.count - a.count);
}

export type HubGlint = { id: string; title: string; subject: string | null; createdAt: string };
export type HubDetail = {
  id: string;
  name: string;
  glints: HubGlint[];
  narrowsTo: { id: string; name: string }[];
  partOf: { id: string; name: string }[];
  facets: string[];
};

/** One entity hub: its glints (newest first), what it nests with, and the facets present. */
export async function getHubDetail(entityId: string): Promise<HubDetail | null> {
  const supabase = (await createClient()) as unknown as Db;
  const user = await requireUser();

  const { data: entity } = await supabase
    .from('entities')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('id', entityId)
    .maybeSingle();
  if (!entity) return null;

  const [{ data: links }, { data: childEdges }, { data: parentEdges }] = await Promise.all([
    supabase
      .from('topic_entities')
      .select('topics(id, title, is_group, created_at, subjects(name))')
      .eq('entity_id', entityId),
    supabase.from('entity_parents').select('child_entity_id').eq('parent_entity_id', entityId),
    supabase.from('entity_parents').select('parent_entity_id').eq('child_entity_id', entityId),
  ]);

  const glints: HubGlint[] = ((links ?? []) as {
    topics: {
      id: string;
      title: string;
      is_group: boolean;
      created_at: string;
      subjects: { name: string } | null;
    } | null;
  }[])
    .map((l) => l.topics)
    .filter((t): t is NonNullable<typeof t> => !!t && !t.is_group)
    .map((t) => ({ id: t.id, title: t.title, subject: t.subjects?.name ?? null, createdAt: t.created_at }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const relIds = [
    ...((childEdges ?? []) as { child_entity_id: string }[]).map((e) => e.child_entity_id),
    ...((parentEdges ?? []) as { parent_entity_id: string }[]).map((e) => e.parent_entity_id),
  ];
  const relNames = new Map<string, string>();
  if (relIds.length) {
    const { data: rel } = await supabase.from('entities').select('id, name').in('id', relIds);
    for (const r of (rel ?? []) as { id: string; name: string }[]) relNames.set(r.id, r.name);
  }
  const toRel = (ids: string[]) =>
    ids.map((id) => ({ id, name: relNames.get(id) ?? '' })).filter((r) => r.name);

  const facetSet = new Set<string>();
  const glintIds = glints.map((g) => g.id);
  if (glintIds.length) {
    const { data: tf } = await supabase
      .from('topic_facets')
      .select('facets(name)')
      .in('topic_id', glintIds);
    for (const row of (tf ?? []) as { facets: { name: string } | null }[]) {
      if (row.facets?.name) facetSet.add(row.facets.name);
    }
  }

  return {
    id: entity.id,
    name: entity.name,
    glints,
    narrowsTo: toRel(((childEdges ?? []) as { child_entity_id: string }[]).map((e) => e.child_entity_id)),
    partOf: toRel(((parentEdges ?? []) as { parent_entity_id: string }[]).map((e) => e.parent_entity_id)),
    facets: [...facetSet].sort(),
  };
}
