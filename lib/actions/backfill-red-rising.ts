import { createClient, requireUser } from '@/lib/supabase/server';

export type BackfillResult = {
  grouped: number;
  groupId: string | null;
  note: string;
};

/**
 * One-time backfill for accounts seeded before the Red Rising group existed.
 * Reparents the user's "Red Rising: ..." sub-topics under a single "Red Rising"
 * group topic (is_group), creating or promoting the group as needed. Idempotent.
 * RLS scopes every operation to the current user.
 */
export async function backfillRedRising(): Promise<BackfillResult> {
  const supabase = await createClient();
  const user = await requireUser();

  const { data: children, error: childErr } = await supabase
    .from('topics')
    .select('id, subject_id, title')
    .ilike('title', 'Red Rising:%');
  if (childErr) throw childErr;
  if (!children || children.length === 0) {
    return { grouped: 0, groupId: null, note: 'No "Red Rising:" sub-topics found.' };
  }

  const subjectId = children[0].subject_id;
  // Only regroup children in the same subject as the first match (no cross-subject reparenting).
  const sameSubjectChildren = children.filter((c) => c.subject_id === subjectId);

  // Find an existing "Red Rising" topic in that subject (prefer an existing group),
  // or create one. limit(1) instead of maybeSingle() so a duplicate title never throws.
  const { data: existingRows, error: exErr } = await supabase
    .from('topics')
    .select('id, is_group')
    .eq('subject_id', subjectId)
    .eq('title', 'Red Rising')
    .order('is_group', { ascending: false })
    .limit(1);
  if (exErr) throw exErr;
  const existing = existingRows?.[0] ?? null;

  let groupId: string;
  if (existing) {
    groupId = existing.id;
    if (!existing.is_group) {
      const { error } = await supabase
        .from('topics')
        .update({ is_group: true, parent_topic_id: null })
        .eq('id', groupId);
      if (error) throw error;
    }
  } else {
    const { data: created, error } = await supabase
      .from('topics')
      .insert({ title: 'Red Rising', subject_id: subjectId, user_id: user.id, position: 0, is_group: true })
      .select('id')
      .single();
    if (error) throw error;
    groupId = created.id;
  }

  const childIds = sameSubjectChildren.map((c) => c.id).filter((id) => id !== groupId);
  if (childIds.length > 0) {
    const { error } = await supabase
      .from('topics')
      .update({ parent_topic_id: groupId, is_group: false })
      .in('id', childIds);
    if (error) throw error;
  }

  return { grouped: childIds.length, groupId, note: 'Red Rising sub-topics regrouped.' };
}
