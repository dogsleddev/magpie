import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { relativeDate } from '@/lib/format';
import type { GlintRow } from '@/lib/queries/library';

// A flat list of glints for the Library's Time lens and search results: title,
// then subject, up to two hub tags, and when it was caught. Each row taps to its
// topic. Hub tags keep the entity spine one tap away from any chronological view.
export default function GlintRows({ glints }: { glints: GlintRow[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {glints.map((g) => (
        <li key={g.id}>
          <Link
            href={`/topic/${g.id}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-bg-card px-4 py-3 transition-colors hover:border-border-strong hover:bg-bg-card-2"
          >
            <span className="flex flex-col gap-1">
              <span className="font-medium text-text">{g.title}</span>
              <span className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-text-dim">
                {g.subject && <span className="text-text-muted">{g.subject}</span>}
                {g.entities.map((e) => (
                  <span key={e} className="text-[color:var(--teal)]">
                    {e}
                  </span>
                ))}
                <span>· {relativeDate(g.createdAt)}</span>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-text-dim" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
