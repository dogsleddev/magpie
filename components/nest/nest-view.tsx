'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildNestGraph } from '@/lib/nest/build-graph';
import type { NestFacetMode, NestSource } from '@/lib/nest/types';
import NestCanvas, { type NestTapInfo } from './nest-canvas';
import { cn } from '@/lib/utils';

export default function NestView({ source }: { source: NestSource }) {
  const router = useRouter();
  const [facetMode, setFacetMode] = useState<NestFacetMode>('bridge');
  const [resonance, setResonance] = useState(true);
  const [labels, setLabels] = useState(true);
  const [tapped, setTapped] = useState<NestTapInfo | null>(null);

  const graph = useMemo(
    () => buildNestGraph(source, { facetMode, resonance }),
    [source, facetMode, resonance],
  );

  const subjectName = useMemo(() => new Map(source.subjects.map((s) => [s.id, s.name])), [source]);
  const facetName = useMemo(() => new Map(source.facets.map((f) => [f.id, f.name])), [source]);
  const topicById = useMemo(() => new Map(source.topics.map((t) => [t.id, t])), [source]);

  const tappedTopic = tapped ? topicById.get(tapped.id) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex rounded-lg border border-border bg-bg-input p-0.5">
          {(['bridge', 'thread'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setFacetMode(m)}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors',
                facetMode === m ? 'bg-teal text-bg' : 'text-text-muted hover:text-text',
              )}
            >
              {m === 'bridge' ? 'Bridge' : 'Threads'}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <Toggle on={resonance} onClick={() => setResonance((v) => !v)} label="Resonance" />
          <Toggle on={labels} onClick={() => setLabels((v) => !v)} label="Labels" />
        </div>
      </div>

      <div className="relative h-[calc(100dvh-15rem)] min-h-[400px] overflow-hidden rounded-2xl border border-border bg-bg-card">
        <NestCanvas
          graph={graph}
          showLabels={labels}
          onTopicTap={setTapped}
          className="h-full w-full"
        />

        {tappedTopic && (
          <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-border-strong bg-bg-card-2/95 p-4 shadow-2xl backdrop-blur">
            <button
              type="button"
              onClick={() => setTapped(null)}
              className="absolute right-3 top-3 text-text-dim hover:text-text"
              aria-label="Close"
            >
              ×
            </button>
            <p className="mb-1 text-[11px] uppercase tracking-wide text-text-dim">
              {tappedTopic.parentId ? 'Sub-topic' : tappedTopic.isGroup ? 'Topic group' : 'Topic'}
              {' · '}
              {subjectName.get(tappedTopic.subjectId)}
            </p>
            <h3 className="mb-3 pr-6 font-display text-lg font-medium leading-tight text-text">
              {tappedTopic.title}
            </h3>
            {tappedTopic.facetIds.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {tappedTopic.facetIds.map((fid) => (
                  <span key={fid} className="rounded-full bg-bg-card px-2 py-0.5 text-[10.5px] text-text-muted">
                    {facetName.get(fid)}
                  </span>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => router.push(`/topic/${tappedTopic.id}`)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:underline"
            >
              Open topic →
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-text-dim">
        drag to pan · pinch or scroll to zoom · tap a node · double-tap to focus
      </p>
    </div>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
        on ? 'border-teal bg-teal/15 text-teal' : 'border-border text-text-dim hover:text-text-muted',
      )}
    >
      {label}
    </button>
  );
}
