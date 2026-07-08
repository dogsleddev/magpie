import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client. SERVER-ONLY. Bypasses RLS, so it must never be
 * imported into client code and every query must be scoped to a resolved user.
 *
 * Used by the passwordless one-click login (lib/actions/demo-login.ts): signing
 * a visitor into the shared community account has no auth.uid() yet, so it cannot
 * use the cookie-based SSR client.
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
