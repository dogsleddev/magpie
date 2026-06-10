import type { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import Wordmark from '@/components/brand/wordmark';
import { Button } from '@/components/ui/button';
import { demoLogin } from '@/lib/actions/demo-login';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  let user: User | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // No Supabase env yet (pre-creds boot). Render the login screen anyway.
  }
  if (user) redirect('/app');

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Wordmark className="justify-center" size={32} />
        <h1 className="mt-8 text-center font-display text-2xl font-medium leading-snug text-text">
          Collect curiosities. Talk them through.
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-text-muted">
          A shared wiki for the things we find interesting, with a conversation partner who
          remembers.
        </p>
        <form action={demoLogin} className="mt-8">
          <Button type="submit" variant="primary" size="lg" className="w-full">
            Enter Magpie
          </Button>
        </form>
        <p className="mt-3 text-center text-xs leading-relaxed text-text-dim">
          One shared community space, for now. See what everyone is collecting, and add your own.
        </p>
        {error === 'demo' && (
          <p className="mt-3 text-center text-sm text-danger">
            Could not open the community space. Tap to try again.
          </p>
        )}
      </div>
    </main>
  );
}
