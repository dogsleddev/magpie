import { createClient, requireUser } from '@/lib/supabase/server';
import type { Facet, FacetWithCount } from './types';

export async function getFacetsWithCounts(): Promise<FacetWithCount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('facets')
    .select('*, topic_facets(count)')
    .order('name', { ascending: true })
    .returns<(Facet & { topic_facets: { count: number }[] })[]>();
  if (error) throw error;
  return (data ?? []).map(({ topic_facets, ...facet }) => ({
    ...facet,
    topic_count: topic_facets?.[0]?.count ?? 0,
  }));
}

export async function getFacetsForSubject(subjectId: string): Promise<FacetWithCount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('topic_facets')
    .select('facet_id, facets(*), topics!inner(subject_id)')
    .eq('topics.subject_id', subjectId)
    .returns<{ facet_id: string; facets: Facet | null }[]>();
  if (error) throw error;
  const counts = new Map<string, FacetWithCount>();
  for (const row of data ?? []) {
    if (!row.facets) continue;
    const existing = counts.get(row.facet_id);
    if (existing) existing.topic_count += 1;
    else counts.set(row.facet_id, { ...row.facets, topic_count: 1 });
  }
  return Array.from(counts.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function findOrCreateFacet(name: string): Promise<Facet> {
  const supabase = await createClient();
  const user = await requireUser();
  const trimmed = name.trim();
  const { data: existing } = await supabase
    .from('facets')
    .select('*')
    .eq('user_id', user.id)
    .eq('name', trimmed)
    .maybeSingle();
  if (existing) return existing;
  const { data, error } = await supabase
    .from('facets')
    .insert({ name: trimmed, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setTopicFacets(topicId: string, facetIds: string[]): Promise<void> {
  const supabase = await createClient();
  const { error: delErr } = await supabase.from('topic_facets').delete().eq('topic_id', topicId);
  if (delErr) throw delErr;
  if (facetIds.length === 0) return;
  const rows = facetIds.map((facet_id) => ({ topic_id: topicId, facet_id }));
  const { error } = await supabase.from('topic_facets').insert(rows);
  if (error) throw error;
}
