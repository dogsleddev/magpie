'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';

/**
 * Error boundary for the whole authenticated app. A thrown Server Action or a
 * render error lands here instead of the raw Next error screen, rendered inside
 * the layout (the app bar and bottom tabs stay put). "Try again" re-runs the
 * failed segment; the link is the escape hatch.
 */
export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app] route error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <h1 className="font-display text-2xl font-medium text-text">something glitched.</h1>
      <p className="max-w-xs text-sm text-text-muted">
        maggie dropped the thread for a second. give it another go.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <Button type="button" variant="primary" size="sm" onClick={reset}>
          Try again
        </Button>
        <Link href="/app" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          Back to your grid
        </Link>
      </div>
    </div>
  );
}
