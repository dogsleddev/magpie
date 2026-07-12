import Link from 'next/link';
import type { Route } from 'next';
import { Dices, Layers } from 'lucide-react';
import { getHubRollup } from '@/lib/queries/entities';
import { rediscover } from '@/lib/actions/topics';

// The Library: browse everything you've caught by its entity hubs. Replaces the
// old random Rediscover tab (the spin survives as the dice in the header). Hubs
// lens only for now; the Facets / Subjects / Time lenses follow.
export default async function LibraryPage() {
  const hubs = await getHubRollup(2);
  const top = hubs[0];

  return (
    <div className="flex flex-col gap-5 py-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-medium text-text">Library</h1>
          <p className="text-xs italic text-text-dim">everything you&apos;ve caught.</p>
        </div>
        <form action={rediscover}>
          <button
            type="submit"
            aria-label="Shuffle to a random glint"
            className="rounded-lg border border-border p-2 text-text-dim transition-colors hover:border-border-strong hover:text-text"
          >
            <Dices className="h-4 w-4" />
          </button>
        </form>
      </div>

      {top && (
        <div className="rounded-xl border border-[color:var(--purple-soft)] bg-[rgba(127,119,221,0.09)] p-3.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--purple)]">
            resurface
          </p>
          <p className="mt-1 text-sm text-text">this nest keeps returning to {top.name}</p>
          <p className="mt-0.5 text-xs text-text-dim">{top.count} glints and counting</p>
        </div>
      )}

      {hubs.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-dim">hubs</p>
          {hubs.map((h) => (
            <Link
              key={h.id}
              href={`/library/${h.id}` as Route}
              className="rounded-xl border border-border bg-bg-card px-4 py-3 transition-colors hover:border-border-strong hover:bg-bg-card-2"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-medium text-text">
                  {h.children.length > 0 && (
                    <Layers className="h-3.5 w-3.5 shrink-0 text-[color:var(--teal)]" />
                  )}
                  {h.name}
                </span>
                <span className="shrink-0 rounded-full bg-[rgba(29,158,117,0.12)] px-2 py-0.5 text-xs tabular-nums text-[color:var(--teal)]">
                  {h.count} glints
                </span>
              </div>
              {h.children.length > 0 ? (
                <p className="mt-1.5 truncate text-xs text-text-dim">
                  <span className="text-text-muted">narrows to:</span>{' '}
                  {h.children.slice(0, 4).join(', ')}
                </p>
              ) : (
                <p className="mt-1.5 truncate text-xs text-text-dim">{h.preview.join(' · ')}</p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">
          Catch a few glints and your hubs will gather here.
        </p>
      )}
    </div>
  );
}
