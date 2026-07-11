'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { captureGlint, type CaptureGlintResult } from '@/lib/actions/glints';
import type { ActivityDay, Streak } from '@/lib/queries/activity';
import ActivityStrip from '@/components/home/activity-strip';

/**
 * The catch-a-glint surface. Optimistic: on submit the input clears instantly,
 * a "caught" card appears with the raw text, and (when today is not yet covered)
 * the streak ticks up and today's cell fills right away, so the reward lands in
 * well under a second. A beat later the derived title and the Haiku connection
 * chips arrive, and the streak/strip are reconciled to the server's truth.
 */
export default function GlintCapture({
  initialStreak,
  initialStrip,
}: {
  initialStreak: Streak;
  initialStrip: ActivityDay[];
}) {
  const [value, setValue] = useState('');
  const [streak, setStreak] = useState(initialStreak);
  const [strip, setStrip] = useState(initialStrip);
  const [provisional, setProvisional] = useState<string | null>(null);
  const [result, setResult] = useState<CaptureGlintResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (!text || busy) return;

    const prevStreak = streak;
    const prevStrip = strip;

    setValue('');
    setError(null);
    setResult(null);
    setProvisional(text);
    setBusy(true);

    // Optimistic reward: the first catch of the day ticks the streak up and fills
    // today's cell now, before the AI round-trip returns. Reconciled on result.
    if (!streak.today) {
      setStreak({ ...streak, current: streak.current + 1, today: true });
      setStrip((s) => s.map((d, i) => (i === s.length - 1 ? { ...d, active: true } : d)));
    }

    startTransition(async () => {
      try {
        const r = await captureGlint(text);
        setResult(r);
        setStreak(r.streak);
        setStrip(r.strip);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
        setValue(text);
        setStreak(prevStreak);
        setStrip(prevStrip);
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
            {result?.alreadyHad ? 'already in your nest: ' : 'caught: '}
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
            <div className="space-y-2 pt-1">
              {result.connections.map((c, i) => (
                <div key={i} className="flex flex-col items-start gap-1">
                  {c.topicId ? (
                    <Link
                      href={`/topic/${c.topicId}`}
                      className="rounded-full border px-2.5 py-1 text-xs hover:bg-accent"
                    >
                      connects to {c.title}
                    </Link>
                  ) : (
                    <span className="rounded-full border px-2.5 py-1 text-xs">
                      connects to {c.title}
                    </span>
                  )}
                  {c.why && (
                    <p className="pl-1 text-xs leading-snug text-muted-foreground">{c.why}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">a fresh one. nothing connects yet.</p>
          )}
        </div>
      )}

      <ActivityStrip days={strip} />
    </div>
  );
}
