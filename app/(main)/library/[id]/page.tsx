import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { getHubDetail } from '@/lib/queries/entities';
import { relativeDate } from '@/lib/format';
import BackLink from '@/components/nav/back-link';

export default async function HubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hub = await getHubDetail(id);
  if (!hub) notFound();

  return (
    <div className="flex flex-col gap-5 py-2">
      <BackLink href="/library" label="Library" />

      <div className="flex flex-col gap-2">
        <div>
          <h1 className="font-display text-2xl font-medium text-text">{hub.name}</h1>
          <p className="text-xs text-text-dim">
            {hub.glints.length} glint{hub.glints.length === 1 ? '' : 's'}
            {hub.partOf.length > 0 && (
              <>
                {' · '}
                <span className="text-text-muted">part of:</span> {hub.partOf.map((p) => p.name).join(', ')}
              </>
            )}
          </p>
        </div>
        {hub.glints.length >= 2 && (
          <Link
            href={`/nest?focus=${id}` as Route}
            className="inline-flex w-max items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-text-muted transition-colors hover:border-teal hover:text-teal"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
            see as nest
          </Link>
        )}
      </div>

      {hub.narrowsTo.length > 0 && (
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-text-dim">
            narrows to
          </p>
          <div className="flex flex-wrap gap-2">
            {hub.narrowsTo.map((c) => (
              <Link
                key={c.id}
                href={`/library/${c.id}` as Route}
                className="rounded-full border border-border px-3 py-1 text-sm text-text-muted transition-colors hover:border-border-strong hover:text-text"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {hub.facets.length > 0 && (
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-text-dim">
            facets here
          </p>
          <div className="flex flex-wrap gap-2">
            {hub.facets.map((f) => (
              <span
                key={f}
                className="rounded-full border border-border px-3 py-1 text-sm text-text-muted"
              >
                #{f}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-text-dim">glints</p>
        <ul className="flex flex-col gap-2">
          {hub.glints.map((g) => (
            <li key={g.id}>
              <Link
                href={`/topic/${g.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-bg-card px-4 py-3 transition-colors hover:border-border-strong hover:bg-bg-card-2"
              >
                <span className="flex flex-col gap-1">
                  <span className="font-medium text-text">{g.title}</span>
                  <span className="text-[11px] text-text-dim">
                    {g.subject ? `${g.subject} · ` : ''}
                    {relativeDate(g.createdAt)}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-text-dim" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
