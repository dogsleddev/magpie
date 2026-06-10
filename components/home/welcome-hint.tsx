'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { WELCOME_HINT_COOKIE } from './welcome-hint-cookie';

export default function WelcomeHint() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  // Dismissal sticks for a year; the home page reads the cookie server-side so
  // the hint never flashes back on later visits.
  function dismiss() {
    document.cookie = `${WELCOME_HINT_COOKIE}=1; max-age=31536000; path=/; samesite=lax`;
    setDismissed(true);
  }

  return (
    <div className="relative rounded-lg border border-border bg-bg-card-2 py-3 pl-4 pr-10 text-sm text-text-muted">
      You&apos;re in the shared community, everyone&apos;s curiosities in one nest. Tap a subject to
      dive in, or add your own.
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-2 rounded p-1 text-text-dim transition-colors hover:text-text"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
