/**
 * Admin-scoped store for the Linq webhook. Uses the service-role client because
 * the webhook is unauthenticated. Every function takes a resolved userId or
 * conversationId; nothing here is reachable without first matching a phone.
 */
import type { ConversationMessage } from '@/lib/queries/types';
import { createAdminClient } from '@/lib/supabase/admin';

// Untyped admin client (see lib/supabase/admin.ts).
type Admin = ReturnType<typeof createAdminClient>;

const ACTIVE_WINDOW_MS = 60 * 60 * 1000; // a conversation is "active" for 60 minutes

export async function getUserIdByPhone(admin: Admin, phone: string): Promise<string | null> {
  const { data, error } = await admin
    .from('user_settings')
    .select('user_id')
    .eq('phone_number', phone)
    .maybeSingle();
  if (error) throw error;
  return data?.user_id ?? null;
}

export type ActiveConversation = { id: string; messages: ConversationMessage[] };

export async function getOrCreateActiveImessageConversation(
  admin: Admin,
  userId: string,
): Promise<ActiveConversation> {
  const cutoff = new Date(Date.now() - ACTIVE_WINDOW_MS).toISOString();
  const { data: existing, error } = await admin
    .from('conversations')
    .select('id, messages')
    .eq('user_id', userId)
    .eq('kind', 'imessage')
    .gte('updated_at', cutoff)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (existing) {
    return { id: existing.id, messages: (existing.messages as ConversationMessage[]) ?? [] };
  }

  const { data: created, error: insErr } = await admin
    .from('conversations')
    .insert({ user_id: userId, kind: 'imessage', topic_id: null, messages: [] })
    .select('id')
    .single();
  if (insErr) throw insErr;
  return { id: created.id, messages: [] };
}

export async function setConversationMessages(
  admin: Admin,
  conversationId: string,
  messages: ConversationMessage[],
): Promise<void> {
  const { error } = await admin
    .from('conversations')
    .update({ messages })
    .eq('id', conversationId);
  if (error) throw error;
}
