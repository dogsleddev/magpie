'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export default function WelcomeHint() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="relative rounded-lg border border-border bg-bg-card-2 py-3 pl-4 pr-10 text-sm text-text-muted">
      Tap a subject to dive in. Click Add a Topic and connect to the community.
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="absolute right-2 top-2 rounded p-1 text-text-dim transition-colors hover:text-text"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
