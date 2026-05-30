import type { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import Wordmark from '@/components/brand/wordmark';
import MagicLinkForm from '@/components/auth/magic-link-form';
import DevSignIn from '@/components/auth/dev-sign-in';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Sign in' };

export default async function LoginPage() {
  let user: User | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // No Supabase env yet (pre-creds boot). Render the login screen anyway.
  }
  if (user) redirect('/');

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Wordmark className="justify-center" size={32} />
        <h1 className="mt-8 text-center font-display text-2xl font-medium leading-snug text-text">
          Collect curiosities. Talk them through.
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-text-muted">
          A personal wiki for the things you find shiny, with a conversation partner who remembers.
        </p>
        <div className="mt-8">
          <MagicLinkForm />
        </div>
        <DevSignIn />
      </div>
    </main>
  );
}
