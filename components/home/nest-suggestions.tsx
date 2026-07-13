'use client';

import { useState, useTransition } from 'react';
import { acceptNesting } from '@/lib/actions/entities';
import type { NestSuggestion } from '@/lib/actions/topics';

/**
 * Proposed nestings on the caught card: Maggie spotted a broader hub for a glint's
 * entity ("architecture" is really "design"), but that hub does not exist yet, so
 * it is offered as a one-tap accept rather than auto-created (REDESIGN 6.5). Tapping
 * creates the broader hub and the edge; dismissing drops the suggestion. Optimistic.
 */
export default function NestSuggestions({ initial }: { initial: NestSuggestion[] }) {
  const [items, setItems] = useState<NestSuggestion[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (!items.length) return null;

  const keyOf = (s: NestSuggestion) => `${s.childId}:${s.parentName}`;

  function accept(s: NestSuggestion) {
    if (busy) return;
    setBusy(keyOf(s));
    startTransition(async () => {
      try {
        await acceptNesting(s.childId, s.parentName);
        setItems((xs) => xs.filter((x) => keyOf(x) !== keyOf(s)));
      } catch {
        // leave it in place so the user can retry
      } finally {
        setBusy(null);
      }
    });
  }

  function dismiss(s: NestSuggestion) {
    setItems((xs) => xs.filter((x) => keyOf(x) !== keyOf(s)));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted-foreground">nest?</span>
      {items.map((s) => (
        <span
          key={keyOf(s)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-xs"
        >
          <button
            type="button"
            onClick={() => accept(s)}
            disabled={!!busy}
            className="text-teal transition-opacity disabled:opacity-50"
          >
            {s.childName} under {s.parentName}
          </button>
          <button
            type="button"
            onClick={() => dismiss(s)}
            aria-label={`Dismiss nesting ${s.childName} under ${s.parentName}`}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
