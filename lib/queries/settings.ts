import { createClient, requireUser } from '@/lib/supabase/server';
import type { UserSettings } from './types';

export async function getSettings(): Promise<UserSettings> {
  const supabase = await createClient();
  const user = await requireUser();
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  // The on_auth_user_created trigger normally makes this row. Fall back to
  // creating it if it is somehow missing.
  const { data: created, error: insErr } = await supabase
    .from('user_settings')
    .insert({ user_id: user.id })
    .select()
    .single();
  if (insErr) throw insErr;
  return created;
}

export async function updateSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
  const supabase = await createClient();
  const user = await requireUser();
  // Strip identity and timestamp columns; only preferences are updatable.
  const { user_id, created_at, updated_at, ...updatable } = patch;
  void user_id;
  void created_at;
  void updated_at;
  const { data, error } = await supabase
    .from('user_settings')
    .update(updatable)
    .eq('user_id', user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
