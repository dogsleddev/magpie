'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { adminEnabled, createAdminClient } from '@/lib/supabase/admin';

const DEMO_EMAIL = 'dogsled@dogsled.dev';
const GEMINI_EMAIL = 'gemini@dogsled.dev';

/**
 * One-click shared-account login: signs the visitor in as a shared account.
 *
 * Two ways in, tried by reliability:
 *   1. Password (the account's password env var) via signInWithPassword.
 *      Simple, robust.
 *   2. Passwordless: mint a magic-link token with the service-role key and
 *      verify it server-side. Fallback for environments with no password set.
 *
 * Both need a server-only secret (Vercel env, or .env.local for local dev).
 * Failures are logged so a misconfigured environment is debuggable instead of
 * silently bouncing to the error screen. redirect() stays outside every
 * try/catch (in the exported actions) because it signals by throwing.
 */
async function sharedAccountLogin(label: string, email: string, password?: string) {
  const supabase = await createClient();
  let ok = false;

  if (password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    ok = !error;
    if (error) console.error(`[${label}] password sign-in failed:`, error.message);
  }

  if (!ok && adminEnabled) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
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
      console.error(`[${label}] passwordless sign-in failed:`, cause);
    }
  }

  if (!ok && !password && !adminEnabled) {
    console.error(
      `[${label}] no credentials configured: set the account password env or SUPABASE_SERVICE_ROLE_KEY`,
    );
  }

  return ok;
}

/** The community demo account (dogsled@dogsled.dev). */
export async function demoLogin(formData?: FormData) {
  // DEMO_OPEN=false is the operator kill switch. It hides the landing buttons,
  // but a Server Action stays a live POST endpoint, so enforce it here too.
  if (process.env.DEMO_OPEN === 'false') redirect('/login?error=closed');
  const openAdd = formData?.get('openAdd') === '1';
  const goNest = formData?.get('goNest') === '1';

  const ok = await sharedAccountLogin('demo-login', DEMO_EMAIL, process.env.DEMO_LOGIN_PASSWORD);

  redirect(ok ? (goNest ? '/nest' : openAdd ? '/app?add=1' : '/home') : '/login?error=demo');
}

/**
 * The Gemini meetup presentation account (gemini@dogsled.dev). Reached from
 * the landing section button and the /gemini QR direct link. Seed and manage
 * the account with scripts/setup-gemini-account.mjs.
 */
export async function geminiLogin() {
  if (process.env.DEMO_OPEN === 'false') redirect('/login?error=closed');
  const ok = await sharedAccountLogin(
    'gemini-login',
    GEMINI_EMAIL,
    process.env.GEMINI_LOGIN_PASSWORD,
  );

  redirect(ok ? '/app' : '/login?error=demo');
}
