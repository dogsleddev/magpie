'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { moveTopicToSubject, updateTopicFacetsByName } from '@/lib/actions/topics';

type SubjectOption = { id: string; name: string };

/**
 * Inline subject + facet editor shown on the topic header. Swap the subject,
 * add/remove facets; each change persists and refreshes. Reuses the same
 * actions as the Recent Ideas inline editor.
 */
export default function TopicMetaEditor({
  topicId,
  subjectId,
  initialFacets,
  subjects,
  allFacets,
}: {
  topicId: string;
  subjectId: string;
  initialFacets: { name: string; id: string }[];
  subjects: SubjectOption[];
  allFacets: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [facets, setFacets] = useState<string[]>(() => initialFacets.map((f) => f.name));
  const [adding, setAdding] = useState('');
  const [saveError, setSaveError] = useState(false);
  // name -> id for the facets that exist, so each chip can link to its filtered page.
  const facetId = new Map(initialFacets.map((f) => [f.name, f.id]));

  function persistFacets(next: string[]) {
    const prev = facets;
    setFacets(next);
    setSaveError(false);
    startTransition(async () => {
      try {
        await updateTopicFacetsByName(topicId, next);
        router.refresh();
      } catch {
        setFacets(prev);
        setSaveError(true);
      }
    });
  }

  function changeSubject(next: string) {
    if (next === subjectId) return;
    setSaveError(false);
    startTransition(async () => {
      try {
        await moveTopicToSubject(topicId, next);
        router.refresh();
      } catch {
        setSaveError(true);
      }
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
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={subjectId}
        onChange={(e) => changeSubject(e.target.value)}
        disabled={pending}
        aria-label="Subject"
        className="rounded-full border border-border bg-bg-card-2 px-2.5 py-0.5 text-xs text-text-muted focus-visible:border-border-strong focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal"
      >
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {facets.map((name) => {
        const id = facetId.get(name);
        return (
          <span
            key={name}
            className="inline-flex items-center gap-1 rounded-full bg-bg-card-2 px-2.5 py-0.5 text-xs text-text-dim"
          >
            {id ? (
              <Link
                href={`/facets/${id}`}
                className="transition-colors hover:text-teal"
                title={`See all #${name} topics`}
              >
                #{name}
              </Link>
            ) : (
              <span>#{name}</span>
            )}
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
        );
      })}

      <input
        list={`facets-${topicId}`}
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
        aria-label="Add a facet"
        className="w-20 rounded-full border border-dashed border-border bg-transparent px-2.5 py-0.5 text-xs text-text placeholder:text-text-dim focus-visible:border-border-strong focus-visible:outline-none"
      />
      <datalist id={`facets-${topicId}`}>
        {suggestions.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>

      {pending && <span className="text-[11px] text-text-dim">saving...</span>}
      {saveError && !pending && (
        <span className="text-[11px] text-danger">couldn&apos;t save, try again</span>
      )}
    </div>
  );
}
