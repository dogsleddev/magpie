'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { adminEnabled, createAdminClient } from '@/lib/supabase/admin';

const DEMO_EMAIL = 'dogsled@dogsled.dev';

/**
 * One-click demo login for the hackathon: signs the visitor in as the demo
 * account and drops them inside. No guard rails for tonight.
 *
 * Preferred path is passwordless via the service-role key (already in Vercel):
 * mint a magic-link token for the demo user and verify it server-side. Falls
 * back to DEMO_LOGIN_PASSWORD if that path is unavailable, so it works no
 * matter what.
 */
export async function demoLogin() {
  const supabase = await createClient();
  let ok = false;

  if (adminEnabled) {
    try {
      const admin = createAdminClient();
      const { data } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: DEMO_EMAIL,
      });
      const tokenHash = data?.properties?.hashed_token;
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
        ok = !error;
      }
    } catch {
      ok = false;
    }
  }

  if (!ok && process.env.DEMO_LOGIN_PASSWORD) {
    const { error } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: process.env.DEMO_LOGIN_PASSWORD,
    });
    ok = !error;
  }

  redirect(ok ? '/' : '/login?error=demo');
}
