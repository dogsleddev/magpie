import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { SubjectWithCount } from '@/lib/queries/types';

export default function SubjectList({ subjects }: { subjects: SubjectWithCount[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {subjects.map((subject) => (
        <li key={subject.id}>
          <Link
            href={`/subject/${subject.id}`}
            className="flex items-center justify-between rounded-lg border border-border bg-bg-card px-4 py-3.5 transition-colors hover:border-border-strong hover:bg-bg-card-2"
          >
            <span className="font-medium text-text">{subject.name}</span>
            <span className="flex items-center gap-2 text-sm text-text-dim">
              {subject.topic_count}
              <ChevronRight className="h-4 w-4" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
