'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TopicWithFacets } from '@/lib/queries/types';

export default function SubjectTopics({ topics }: { topics: TopicWithFacets[] }) {
  const [activeFacet, setActiveFacet] = useState<string | null>(null);

  const facets = useMemo(() => {
    const counts = new Map<string, number>();
    for (const topic of topics) {
      for (const facet of topic.facets) {
        counts.set(facet.name, (counts.get(facet.name) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [topics]);

  const filtered = activeFacet
    ? topics.filter((t) => t.facets.some((f) => f.name === activeFacet))
    : topics;

  if (topics.length === 0) {
    return <p className="mt-4 text-sm text-text-muted">No topics here yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {facets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <FacetChip
            label="All"
            active={activeFacet === null}
            onClick={() => setActiveFacet(null)}
          />
          {facets.map((facet) => (
            <FacetChip
              key={facet.name}
              label={facet.name}
              count={facet.count}
              active={activeFacet === facet.name}
              onClick={() => setActiveFacet(facet.name)}
            />
          ))}
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {filtered.map((topic) => (
          <li key={topic.id}>
            <Link
              href={`/topic/${topic.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-bg-card px-4 py-3.5 transition-colors hover:border-border-strong hover:bg-bg-card-2"
            >
              <span className="flex flex-col gap-1">
                <span className="font-medium text-text">{topic.title}</span>
                {topic.facets.length > 0 && (
                  <span className="flex flex-wrap gap-1.5">
                    {topic.facets.map((facet) => (
                      <span key={facet.id} className="text-[11px] text-text-dim">
                        #{facet.name}
                      </span>
                    ))}
                  </span>
                )}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-text-dim" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FacetChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs transition-colors',
        active
          ? 'border-teal bg-teal/15 text-teal'
          : 'border-border text-text-muted hover:border-border-strong',
      )}
    >
      {label}
      {count !== undefined ? ` ${count}` : ''}
    </button>
  );
}
