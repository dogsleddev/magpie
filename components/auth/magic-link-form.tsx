'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function MagicLinkForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setStatus('error');
        setError(error.message);
        return;
      }
      setStatus('sent');
    } catch {
      setStatus('error');
      setError('Could not reach sign-in. Please try again in a moment.');
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-lg border border-border bg-bg-card p-4 text-center">
        <p className="text-text">Check your email.</p>
        <p className="mt-1 text-sm text-text-muted">Sign-in link sent to {email}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        type="email"
        required
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        aria-label="Email address"
      />
      <Button type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending...' : 'Send magic link'}
      </Button>
      {status === 'error' && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
