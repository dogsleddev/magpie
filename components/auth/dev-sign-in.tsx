'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Email + password sign-in. An alternative to the magic link for accounts that
 * have a password set (Supabase Authentication > Users). Rendered in all
 * environments. (File name is historical; this is the password sign-in option.)
 */
export default function DevSignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/app');
    router.refresh();
  }

  return (
    <details className="mt-6 rounded-lg border border-dashed border-border bg-bg-card/50 p-3">
      <summary className="cursor-pointer text-xs text-text-dim">Sign in with password</summary>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2">
        <Input
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />
        <Input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <Button type="submit" variant="secondary" size="sm" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </Button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </form>
    </details>
  );
}
