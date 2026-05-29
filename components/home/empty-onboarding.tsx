'use client';

import { useState, useTransition } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadStarterPack } from '@/lib/actions/onboarding';

export default function EmptyOnboarding() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  return (
    <div className="mt-10 flex flex-col items-center text-center">
      <h1 className="font-display text-2xl font-medium leading-snug text-text">
        Collect curiosities. Talk them through.
      </h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-muted">
        Start with a curated set of subjects and topics. Edit, add, or delete anything later.
      </p>
      <Button
        className="mt-6"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError('');
            try {
              await loadStarterPack();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Something went wrong.');
            }
          })
        }
      >
        <Sparkles className="h-4 w-4" />
        {pending ? 'Loading your nest...' : 'Load the starter pack'}
      </Button>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
