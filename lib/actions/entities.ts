'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/supabase/server';
import {
  addEntityParent,
  findOrCreateEntity,
  getEntitiesLite,
  linkTopicEntity,
  unlinkTopicEntity,
} from '@/lib/queries/entities';

export type EntityChip = { id: string; name: string };

/**
 * Add an entity to a glint (the "+ add" chip on the caught card). Finds or
 * creates the hub (reuse wins), links it, and returns it so the client can swap
 * its optimistic placeholder for the real hub. RLS gates the link through the
 * topic and the entity, so a user can only touch their own.
 */
export async function addTopicEntity(topicId: string, name: string): Promise<EntityChip> {
  await requireUser();
  const clean = name.trim();
  if (!clean) throw new Error('Give the entity a name.');
  const hub = await findOrCreateEntity(clean);
  await linkTopicEntity(topicId, hub.id);
  revalidatePath('/home');
  revalidatePath('/library');
  return { id: hub.id, name: hub.name };
}

/** Remove an entity from a glint (the "x" on a chip). The hub itself survives. */
export async function removeTopicEntity(topicId: string, entityId: string): Promise<void> {
  await requireUser();
  await unlinkTopicEntity(topicId, entityId);
  revalidatePath('/home');
  revalidatePath('/library');
}

/** The user's existing hubs, for the "+ add" typeahead (reuse beats proliferation). */
export async function suggestEntities(): Promise<EntityChip[]> {
  await requireUser();
  return (await getEntitiesLite()).map((e) => ({ id: e.id, name: e.name }));
}

/**
 * Accept a proposed nesting (the "nest under X?" chip on the caught card). Creates
 * the broader hub if needed and adds the child -> parent edge. This is the only
 * path that mints a new broader hub, so a single-child ghost exists only when the
 * user opted into it (REDESIGN 6.5, propose-not-automatic).
 */
export async function acceptNesting(childId: string, parentName: string): Promise<EntityChip> {
  await requireUser();
  const clean = parentName.trim();
  if (!clean) throw new Error('Give the broader hub a name.');
  const parent = await findOrCreateEntity(clean);
  await addEntityParent(childId, parent.id);
  revalidatePath('/home');
  revalidatePath('/library');
  revalidatePath('/nest');
  return { id: parent.id, name: parent.name };
}
