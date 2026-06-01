'use server';

import { createClient } from '@/lib/supabase/server';

type WaitlistState = { ok: boolean; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Public waitlist sign-up from the marketing landing. Inserts through the
 * anon SSR client (RLS allows anon INSERT, no reads). A duplicate email hits
 * the unique constraint (23505) and is treated as a friendly success.
 */
export async function joinWaitlist(
  _prev: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();

  if (!EMAIL_RE.test(email)) {
    return { ok: false, message: 'enter a valid email' };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from('waitlist').insert({ email, source: 'landing' });

    if (error) {
      if (error.code === '23505') {
        return { ok: true, message: "you're already on the list" };
      }
      console.error('[waitlist] insert failed:', error.message);
      return { ok: false, message: 'something went wrong, try again' };
    }

    return { ok: true, message: '' };
  } catch {
    return { ok: false, message: 'something went wrong, try again' };
  }
}
