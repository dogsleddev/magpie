'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Monitor } from 'lucide-react';
import { buildNestGraph } from '@/lib/nest/build-graph';
import type { NestFacetMode, NestSource } from '@/lib/nest/types';
import NestCanvas, { type NestTapInfo } from './nest-canvas';
import NestDesktopView from './nest-desktop-view';
import NestTopicCard from './nest-topic-card';
import { cn } from '@/lib/utils';

export default function NestView({
  source,
  focusEntityId = null,
}: {
  source: NestSource;
  focusEntityId?: string | null;
}) {
  const router = useRouter();
  const [facetMode, setFacetMode] = useState<NestFacetMode>('bridge');
  const [resonance, setResonance] = useState(true);
  // Arriving via a hub's "see as nest" jump: start with the entity layer on so
  // the hub we fly to is actually drawn.
  const [entities, setEntities] = useState(Boolean(focusEntityId));
  const [labels, setLabels] = useState(true);
  const [tapped, setTapped] = useState<NestTapInfo | null>(null);
  const [desktop, setDesktop] = useState(false);

  // Everyone lands straight in the full-bleed desktop view, phones included.
  // Set in an effect (not initial state) so SSR and hydration match; exiting
  // back to the compact view sticks because this only runs on mount.
  useEffect(() => {
    setDesktop(true);
  }, []);

  const graph = useMemo(
    () => buildNestGraph(source, { facetMode, resonance, entities }),
    [source, facetMode, resonance, entities],
  );

  const subjectName = useMemo(() => new Map(source.subjects.map((s) => [s.id, s.name])), [source]);
  const facetName = useMemo(() => new Map(source.facets.map((f) => [f.id, f.name])), [source]);
  const topicById = useMemo(() => new Map(source.topics.map((t) => [t.id, t])), [source]);

  const tappedTopic = tapped ? topicById.get(tapped.id) : null;

  return (
    <>
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
            <Toggle on={entities} onClick={() => setEntities((v) => !v)} label="Entities" />
            <Toggle on={resonance} onClick={() => setResonance((v) => !v)} label="Resonance" />
            <Toggle on={labels} onClick={() => setLabels((v) => !v)} label="Labels" />
          </div>
        </div>

        <div className="relative h-[calc(100dvh-15rem)] min-h-[400px] overflow-hidden rounded-2xl border border-border bg-bg-card">
          <NestCanvas
            graph={graph}
            showLabels={labels}
            focusNodeId={focusEntityId}
            onTopicTap={setTapped}
            onEntityTap={(id) => router.push(`/library/${id}` as Route)}
            className="h-full w-full"
          />

          <button
            type="button"
            onClick={() => setDesktop(true)}
            className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-card-2/90 px-3 py-1.5 text-[11px] font-medium text-text-muted backdrop-blur transition-colors hover:text-text"
            aria-label="Open desktop view"
          >
            <Monitor className="h-3.5 w-3.5" /> Desktop
          </button>

          {tappedTopic && (
            <NestTopicCard
              topic={tappedTopic}
              subjectName={subjectName.get(tappedTopic.subjectId)}
              facetName={(id) => facetName.get(id)}
              onClose={() => setTapped(null)}
              className="absolute inset-x-3 bottom-3"
            />
          )}
        </div>

        <p className="text-center text-[11px] text-text-dim">
          drag to pan · pinch or scroll to zoom · tap a node · double-tap to focus
        </p>
      </div>

      {desktop && (
        <NestDesktopView
          source={source}
          initial={{ facetMode, resonance, labels, entities }}
          focusEntityId={focusEntityId}
          onClose={() => setDesktop(false)}
        />
      )}
    </>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
        on
          ? 'border-teal bg-teal/15 text-teal'
          : 'border-border text-text-dim hover:text-text-muted',
      )}
    >
      {label}
    </button>
  );
}
