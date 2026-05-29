import { createClient, requireUser } from '@/lib/supabase/server';
import { createTopic } from './topics';
import type { DiscoverItem, Topic } from './types';

export async function getPendingDiscover(): Promise<DiscoverItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('discover_items')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addDiscoverItems(items: { title: string; source: string }[]): Promise<void> {
  if (items.length === 0) return;
  const supabase = await createClient();
  const user = await requireUser();
  const rows = items.map((item) => ({
    title: item.title,
    source: item.source,
    user_id: user.id,
  }));
  const { error } = await supabase.from('discover_items').insert(rows);
  if (error) throw error;
}

export async function acceptDiscoverItem(id: string, subjectId: string): Promise<Topic> {
  const supabase = await createClient();
  const { data: item, error: itemErr } = await supabase
    .from('discover_items')
    .select('*')
    .eq('id', id)
    .single();
  if (itemErr) throw itemErr;

  const topic = await createTopic({ title: item.title, subjectId });

  const { error } = await supabase
    .from('discover_items')
    .update({ status: 'accepted' })
    .eq('id', id);
  if (error) throw error;

  return topic;
}

export async function skipDiscoverItem(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('discover_items')
    .update({ status: 'skipped' })
    .eq('id', id);
  if (error) throw error;
}
