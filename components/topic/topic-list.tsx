import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { TopicWithSubjectAndFacets } from '@/lib/queries/types';

export default function TopicList({ topics }: { topics: TopicWithSubjectAndFacets[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {topics.map((topic) => (
        <li key={topic.id}>
          <Link
            href={`/topic/${topic.id}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-bg-card px-4 py-3.5 transition-colors hover:border-border-strong hover:bg-bg-card-2"
          >
            <span className="flex flex-col gap-1">
              <span className="font-medium text-text">{topic.title}</span>
              <span className="flex flex-wrap items-center gap-1.5 text-[11px] text-text-dim">
                <span className="text-text-muted">{topic.subject?.name}</span>
                {topic.facets.map((facet) => (
                  <span key={facet.id}>#{facet.name}</span>
                ))}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-text-dim" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
