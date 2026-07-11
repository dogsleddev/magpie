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
