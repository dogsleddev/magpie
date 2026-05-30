import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client. SERVER-ONLY. Bypasses RLS, so it must never be
 * imported into client code and every query must be scoped to a resolved user.
 *
 * Needed for the Linq webhook: an unauthenticated external POST has no
 * auth.uid(), so it cannot use the cookie-based SSR client to find a user by
 * phone number or write that user's conversation.
 *
 * Intentionally untyped (no <Database> generic) so the hackathon columns added
 * in 0002 (conversations.kind, nullable topic_id, user_settings.phone_number)
 * compile before `npm run db:types` is regenerated.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const adminEnabled = !!(url && serviceKey);

export function createAdminClient() {
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) are required');
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
