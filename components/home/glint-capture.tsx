'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { captureGlint, type CaptureGlintResult } from '@/lib/actions/glints';
import type { Streak } from '@/lib/queries/activity';

/**
 * The catch-a-glint surface. Optimistic: on submit the input clears instantly
 * and a "caught" card appears with the raw text, so it feels done in well under
 * a second. A beat later the derived title and the Haiku connection chips land.
 */
export default function GlintCapture({ initialStreak }: { initialStreak: Streak }) {
  const [value, setValue] = useState('');
  const [streak, setStreak] = useState(initialStreak);
  const [provisional, setProvisional] = useState<string | null>(null);
  const [result, setResult] = useState<CaptureGlintResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (!text || busy) return;
    setValue('');
    setError(null);
    setResult(null);
    setProvisional(text);
    setBusy(true);
    startTransition(async () => {
      try {
        const r = await captureGlint(text);
        setResult(r);
        setStreak(r.streak);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
        setValue(text);
      } finally {
        setProvisional(null);
        setBusy(false);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <div className="text-4xl font-semibold leading-none tabular-nums">{streak.current}</div>
        <div className="text-xs text-muted-foreground">
          day{streak.current === 1 ? '' : 's'} streak
          {streak.longest > streak.current ? ` · best ${streak.longest}` : ''}
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="what caught your eye today?"
          aria-label="Catch a glint"
          autoFocus
          className="flex-1 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {busy ? 'catching' : 'catch'}
        </button>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {(provisional || result) && (
        <div className="space-y-2 rounded-xl border p-3">
          <div className="text-sm">
            caught:{' '}
            {result ? (
              <Link
                href={`/topic/${result.topicId}`}
                className="font-medium underline-offset-2 hover:underline"
              >
                {result.title}
              </Link>
            ) : (
              <span className="font-medium">{provisional}</span>
            )}
          </div>

          {!result ? (
            <p className="text-xs text-muted-foreground">finding connections...</p>
          ) : result.connections.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {result.connections.map((c, i) =>
                c.topicId ? (
                  <Link
                    key={i}
                    href={`/topic/${c.topicId}`}
                    title={c.why}
                    className="rounded-full border px-2.5 py-1 text-xs hover:bg-accent"
                  >
                    connects to {c.title}
                  </Link>
                ) : (
                  <span
                    key={i}
                    title={c.why}
                    className="rounded-full border px-2.5 py-1 text-xs"
                  >
                    connects to {c.title}
                  </span>
                ),
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">a fresh one. nothing connects yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
