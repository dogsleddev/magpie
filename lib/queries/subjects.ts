import { createClient, requireUser } from '@/lib/supabase/server';
import type { Subject, SubjectWithCount } from './types';

export async function getSubjectsWithCounts(): Promise<SubjectWithCount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subjects')
    .select('*, topics(count)')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })
    .returns<(Subject & { topics: { count: number }[] })[]>();
  if (error) throw error;
  return (data ?? []).map(({ topics, ...subject }) => ({
    ...subject,
    topic_count: topics?.[0]?.count ?? 0,
  }));
}

export async function createSubject(name: string): Promise<Subject> {
  const supabase = await createClient();
  const user = await requireUser();
  const { data: last } = await supabase
    .from('subjects')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (last?.position ?? -1) + 1;
  const { data, error } = await supabase
    .from('subjects')
    .insert({ name: name.trim(), user_id: user.id, position })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSubjectName(id: string, name: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('subjects').update({ name: name.trim() }).eq('id', id);
  if (error) throw error;
}

export async function deleteSubject(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderSubjects(orderedIds: string[]): Promise<void> {
  const supabase = await createClient();
  const user = await requireUser();
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('subjects')
      .update({ position: i })
      .eq('id', orderedIds[i])
      .eq('user_id', user.id);
    if (error) throw error;
  }
}
