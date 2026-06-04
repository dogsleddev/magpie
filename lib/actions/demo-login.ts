'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { adminEnabled, createAdminClient } from '@/lib/supabase/admin';

const DEMO_EMAIL = 'dogsled@dogsled.dev';

/**
 * One-click demo login: signs the visitor in as the shared demo account.
 *
 * Two ways in, tried by reliability:
 *   1. Password (DEMO_LOGIN_PASSWORD) via signInWithPassword. Simple, robust.
 *   2. Passwordless: mint a magic-link token with the service-role key and
 *      verify it server-side. Fallback for environments with no password set.
 *
 * Both need a server-only secret (Vercel env, or .env.local for local dev).
 * Failures are logged so a misconfigured environment is debuggable instead of
 * silently bouncing to the error screen. redirect() stays outside every
 * try/catch because it signals by throwing.
 */
export async function demoLogin(formData?: FormData) {
  const supabase = await createClient();
  const openAdd = formData?.get('openAdd') === '1';
  const goNest = formData?.get('goNest') === '1';
  let ok = false;

  const password = process.env.DEMO_LOGIN_PASSWORD;
  if (password) {
    const { error } = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password });
    ok = !error;
    if (error) console.error('[demo-login] password sign-in failed:', error.message);
  }

  if (!ok && adminEnabled) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: DEMO_EMAIL,
      });
      if (error) throw error;
      const tokenHash = data?.properties?.hashed_token;
      if (!tokenHash) throw new Error('generateLink returned no token hash');
      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'email',
      });
      if (otpError) throw otpError;
      ok = true;
    } catch (cause) {
      console.error('[demo-login] passwordless sign-in failed:', cause);
    }
  }

  if (!ok && !password && !adminEnabled) {
    console.error(
      '[demo-login] no credentials configured: set DEMO_LOGIN_PASSWORD or SUPABASE_SERVICE_ROLE_KEY',
    );
  }

  redirect(ok ? (goNest ? '/nest' : openAdd ? '/app?add=1' : '/app') : '/login?error=demo');
}
