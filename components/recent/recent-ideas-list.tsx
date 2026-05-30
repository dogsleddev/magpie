'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { moveTopicToSubject, updateTopicFacetsByName } from '@/lib/actions/topics';
import type { TopicWithSubjectAndFacets } from '@/lib/queries/types';

type SubjectOption = { id: string; name: string };

export default function RecentIdeasList({
  topics,
  subjects,
  allFacets,
}: {
  topics: TopicWithSubjectAndFacets[];
  subjects: SubjectOption[];
  allFacets: string[];
}) {
  if (topics.length === 0) {
    return (
      <p className="text-sm text-text-muted">Nothing captured yet. Add a topic to get started.</p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {topics.map((topic) => (
        <RecentRow key={topic.id} topic={topic} subjects={subjects} allFacets={allFacets} />
      ))}
    </ul>
  );
}

function RecentRow({
  topic,
  subjects,
  allFacets,
}: {
  topic: TopicWithSubjectAndFacets;
  subjects: SubjectOption[];
  allFacets: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [facets, setFacets] = useState<string[]>(topic.facets.map((f) => f.name));
  const [adding, setAdding] = useState('');

  function persistFacets(next: string[]) {
    setFacets(next);
    startTransition(async () => {
      await updateTopicFacetsByName(topic.id, next);
      router.refresh();
    });
  }

  function changeSubject(subjectId: string) {
    if (subjectId === topic.subject_id) return;
    startTransition(async () => {
      await moveTopicToSubject(topic.id, subjectId);
      router.refresh();
    });
  }

  function addFacet(name: string) {
    const clean = name.trim().toLowerCase();
    setAdding('');
    if (!clean || facets.includes(clean)) return;
    persistFacets([...facets, clean]);
  }

  const suggestions = allFacets.filter((f) => !facets.includes(f));

  return (
    <li className="flex flex-col gap-2.5 rounded-lg border border-border bg-bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/topic/${topic.id}`} className="font-medium text-text hover:text-teal">
          {topic.title}
        </Link>
        {pending && <span className="shrink-0 text-[11px] text-text-dim">saving...</span>}
      </div>

      <label className="flex items-center gap-2 text-xs text-text-dim">
        <span className="shrink-0">Subject</span>
        <select
          value={topic.subject_id}
          onChange={(e) => changeSubject(e.target.value)}
          disabled={pending}
          className="flex-1 rounded border border-border bg-bg-input px-2 py-1.5 text-xs text-text focus-visible:border-border-strong focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal"
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap items-center gap-1.5">
        {facets.map((name) => (
          <span
            key={name}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-bg-card-2 px-2 py-0.5 text-[11px] text-text-muted"
          >
            #{name}
            <button
              type="button"
              onClick={() => persistFacets(facets.filter((f) => f !== name))}
              disabled={pending}
              aria-label={`Remove ${name}`}
              className="text-text-dim transition-colors hover:text-danger"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          list={`facets-${topic.id}`}
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addFacet(adding);
            }
          }}
          onBlur={() => adding.trim() && addFacet(adding)}
          placeholder="+ facet"
          className="w-24 rounded border border-dashed border-border bg-transparent px-2 py-0.5 text-[11px] text-text placeholder:text-text-dim focus-visible:border-border-strong focus-visible:outline-none"
        />
        <datalist id={`facets-${topic.id}`}>
          {suggestions.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>
      </div>
    </li>
  );
}
