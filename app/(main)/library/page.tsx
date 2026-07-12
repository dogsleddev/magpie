import Link from 'next/link';
import type { Route } from 'next';
import { Dices, Layers, Search } from 'lucide-react';
import { getHubRollup } from '@/lib/queries/entities';
import { getGlintCount, getGlintTimeline, searchGlints, type GlintRow } from '@/lib/queries/library';
import { rediscover } from '@/lib/actions/topics';
import GlintRows from '@/components/library/glint-rows';
import { cn } from '@/lib/utils';

// The Library: browse everything you've caught. The Hubs lens (entity rollups) is
// primary; the Time lens is the chronological view and the cold-start default when
// there are few glints. Search matches glint text and entity names. Server-first:
// the lens and query live in the URL. Facets / Subjects lenses come later.
type Lens = 'hubs' | 'time' | 'search';
const COLD_START = 5;

function bucket(iso: string): 'this week' | 'last week' | 'earlier' {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 7) return 'this week';
  if (days < 14) return 'last week';
  return 'earlier';
}

function Shell({
  active,
  query,
  children,
}: {
  active: Lens;
  query: string;
  children: React.ReactNode;
}) {
  const seg = (label: string, lens: 'hubs' | 'time') => (
    <Link
      href={`/library?lens=${lens}` as Route}
      className={cn(
        '-mb-px border-b-2 pb-2',
        active === lens
          ? 'border-[color:var(--teal)] font-medium text-[color:var(--teal)]'
          : 'border-transparent text-text-dim',
      )}
    >
      {label}
    </Link>
  );

  return (
    <div className="flex flex-col gap-4 py-2">
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

      <form action="/library" className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-text-dim" />
        <input
          name="q"
          defaultValue={active === 'search' ? query : ''}
          placeholder="search your glints"
          aria-label="Search your glints"
          className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-dim"
        />
      </form>

      <div className="flex gap-5 border-b border-border text-sm">
        {seg('Hubs', 'hubs')}
        {seg('Time', 'time')}
      </div>

      {children}
    </div>
  );
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ lens?: string; q?: string }>;
}) {
  const { lens, q } = await searchParams;
  const query = (q ?? '').trim();

  if (query) {
    const results = await searchGlints(query);
    return (
      <Shell active="search" query={query}>
        {results.length > 0 ? (
          <GlintRows glints={results} />
        ) : (
          <p className="text-sm text-text-muted">nothing matches &ldquo;{query}&rdquo; yet.</p>
        )}
      </Shell>
    );
  }

  const count = await getGlintCount();
  const active: Lens = lens === 'time' ? 'time' : lens === 'hubs' ? 'hubs' : count < COLD_START ? 'time' : 'hubs';

  if (active === 'time') {
    const glints = await getGlintTimeline();
    const groups: Record<string, GlintRow[]> = { 'this week': [], 'last week': [], earlier: [] };
    for (const g of glints) groups[bucket(g.createdAt)].push(g);
    return (
      <Shell active="time" query="">
        {glints.length > 0 ? (
          <div className="flex flex-col gap-5">
            {(['this week', 'last week', 'earlier'] as const).map((label) =>
              groups[label].length > 0 ? (
                <div key={label} className="flex flex-col gap-2">
                  <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-dim">
                    {label}
                  </p>
                  <GlintRows glints={groups[label]} />
                </div>
              ) : null,
            )}
          </div>
        ) : (
          <p className="text-sm text-text-muted">Catch a glint and it will show up here.</p>
        )}
      </Shell>
    );
  }

  const hubs = await getHubRollup(2);
  const top = hubs[0];
  return (
    <Shell active="hubs" query="">
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
        <p className="text-sm text-text-muted">Catch a few glints and your hubs will gather here.</p>
      )}
    </Shell>
  );
}
