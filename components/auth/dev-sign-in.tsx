'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Dev-only quick sign-in. Skips the magic-link email round-trip during local
 * development. Create a confirmed email+password user in the Supabase dashboard
 * (Authentication > Users > Add user, Auto Confirm on) and use it here.
 * This component is only rendered when NODE_ENV is not production.
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
    router.push('/');
    router.refresh();
  }

  return (
    <details className="mt-6 rounded-lg border border-dashed border-border bg-bg-card/50 p-3">
      <summary className="cursor-pointer text-xs text-text-dim">Dev sign-in (password)</summary>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2">
        <Input
          type="email"
          placeholder="dev email"
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
          {busy ? 'Signing in...' : 'Dev sign-in'}
        </Button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </form>
    </details>
  );
}
