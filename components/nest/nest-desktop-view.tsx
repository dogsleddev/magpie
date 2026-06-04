'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, X } from 'lucide-react';
import { buildNestGraph, subjectColor } from '@/lib/nest/build-graph';
import type { NestFacetMode, NestSource } from '@/lib/nest/types';
import NestCanvas, { type NestTapInfo } from './nest-canvas';
import { cn } from '@/lib/utils';

const TEAL = '#1D9E75';

const FACET_MODES: { v: NestFacetMode; label: string }[] = [
  { v: 'bridge', label: 'Bridge' },
  { v: 'thread', label: 'Threads' },
  { v: 'off', label: 'Off' },
];

type Initial = { facetMode: NestFacetMode; resonance: boolean; labels: boolean };

/**
 * The desktop Nest: a full-bleed canvas with a docked control panel, modeled on
 * docs/nest-desktop.html. Opened as a fixed overlay from the compact NestView so
 * it escapes the app's max-w-md phone frame. State is local and seeded from the
 * compact view's current settings.
 */
export default function NestDesktopView({
  source,
  initial,
  onClose,
}: {
  source: NestSource;
  initial: Initial;
  onClose: () => void;
}) {
  const router = useRouter();
  const [facetMode, setFacetMode] = useState<NestFacetMode>(initial.facetMode);
  const [resonance, setResonance] = useState(initial.resonance);
  const [labels, setLabels] = useState(initial.labels);
  const [drift, setDrift] = useState(true);
  const [repel, setRepel] = useState(70);
  const [linkLen, setLinkLen] = useState(34);
  const [activeFacet, setActiveFacet] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [tapped, setTapped] = useState<NestTapInfo | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  const graph = useMemo(
    () => buildNestGraph(source, { facetMode, resonance }),
    [source, facetMode, resonance],
  );

  const subjects = useMemo(
    () => source.subjects.map((s, i) => ({ ...s, color: subjectColor(i, source.subjects.length) })),
    [source],
  );
  const facets = useMemo(
    () => [...source.facets].sort((a, b) => a.name.localeCompare(b.name)),
    [source],
  );
  const subjectName = useMemo(() => new Map(source.subjects.map((s) => [s.id, s.name])), [source]);
  const facetName = useMemo(() => new Map(source.facets.map((f) => [f.id, f.name])), [source]);
  const topicById = useMemo(() => new Map(source.topics.map((t) => [t.id, t])), [source]);
  const tappedTopic = tapped ? topicById.get(tapped.id) : null;

  const externalHighlight = useMemo(
    () =>
      activeFacet
        ? ({ type: 'facet', id: activeFacet } as const)
        : activeSubject
          ? ({ type: 'node', id: activeSubject } as const)
          : null,
    [activeFacet, activeSubject],
  );

  // lock the page behind the overlay while it's open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Esc steps back out: close a card, then clear a highlight, then exit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (tapped) setTapped(null);
      else if (activeFacet || activeSubject) {
        setActiveFacet(null);
        setActiveSubject(null);
      } else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tapped, activeFacet, activeSubject, onClose]);

  const handleTap = (info: NestTapInfo | null) => {
    setActiveFacet(null);
    setActiveSubject(null);
    setTapped(info);
  };
  const toggleFacet = (id: string) => {
    setActiveSubject(null);
    setTapped(null);
    setActiveFacet((prev) => (prev === id ? null : id));
  };
  const selectSubject = (id: string) => {
    setActiveFacet(null);
    setTapped(null);
    setActiveSubject((prev) => (prev === id ? null : id));
  };
  const resetView = () => {
    setActiveFacet(null);
    setActiveSubject(null);
    setTapped(null);
    setResetKey((k) => k + 1);
  };

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-bg">
      <div className="absolute inset-0">
        <NestCanvas
          key={resetKey}
          graph={graph}
          showLabels={labels}
          ambient={drift}
          repel={repel}
          linkLen={linkLen}
          externalHighlight={externalHighlight}
          subjectsOutside
          onTopicTap={handleTap}
          className="h-full w-full"
        />
      </div>

      {/* title */}
      <div className="pointer-events-none absolute left-5 top-4 flex items-baseline gap-2.5">
        <h1 className="font-display text-xl font-medium text-text">
          Nest<span className="text-teal">.</span>
        </h1>
        <span className="text-[13px] text-text-dim">your curiosity as a constellation</span>
      </div>

      {/* exit */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-card/85 px-3 py-1.5 text-xs font-medium text-text-muted backdrop-blur transition-colors hover:text-text"
      >
        <X className="h-3.5 w-3.5" /> Exit desktop view
      </button>

      {/* docked control panel */}
      <div className="absolute left-4 top-16 z-10 max-h-[calc(100vh-5.5rem)] w-64 overflow-y-auto rounded-2xl border border-border bg-bg-card/85 p-3.5 text-[13px] shadow-2xl backdrop-blur">
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          className="mb-2.5 flex w-full items-center justify-between font-display text-[13px] font-medium uppercase tracking-wide text-text-muted"
        >
          Nest controls
          <span className="text-[11px] text-text-dim">{panelOpen ? 'hide' : 'show'}</span>
        </button>

        {panelOpen && (
          <div className="flex flex-col gap-3.5">
            <Group label="Facet dimension">
              <div className="flex rounded-lg border border-border bg-bg-input p-0.5">
                {FACET_MODES.map((m) => (
                  <button
                    key={m.v}
                    type="button"
                    onClick={() => setFacetMode(m.v)}
                    className={cn(
                      'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                      facetMode === m.v ? 'bg-teal text-bg' : 'text-text-muted hover:text-text',
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </Group>

            <div className="flex flex-col">
              <SwitchRow
                on={resonance}
                onClick={() => setResonance((v) => !v)}
                label="Resonance threads"
              />
              <SwitchRow on={labels} onClick={() => setLabels((v) => !v)} label="Labels" />
              <SwitchRow on={drift} onClick={() => setDrift((v) => !v)} label="Living drift" />
            </div>

            <Group label="Physics">
              <Slider label="Repel" value={repel} min={20} max={220} onCommit={setRepel} />
              <Slider label="Link length" value={linkLen} min={14} max={80} onCommit={setLinkLen} />
            </Group>

            <Group label="Subjects">
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectSubject(s.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded px-1 py-0.5 text-left text-[11px] transition-colors',
                      activeSubject === s.id ? 'text-text' : 'text-text-muted hover:text-text',
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 flex-none rounded-full"
                      style={{ background: s.color }}
                    />
                    <span className="truncate">{s.name}</span>
                  </button>
                ))}
              </div>
            </Group>

            <Group label="Light up a facet (across subjects)">
              <div className="flex flex-wrap gap-1.5">
                {facets.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFacet(f.id)}
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[11px] transition-colors',
                      activeFacet === f.id
                        ? 'border-teal bg-teal font-semibold text-bg'
                        : 'border-border text-text-muted hover:border-border-strong hover:text-text',
                    )}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </Group>

            <button
              type="button"
              onClick={resetView}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs text-text-muted transition-colors hover:border-border-strong hover:text-text"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset view
            </button>
            <p className="text-center text-[11px] text-text-dim">
              {graph.nodes.length} nodes · {graph.links.length} connections
            </p>
          </div>
        )}
      </div>

      {/* node detail popover, near the tap point */}
      {tappedTopic && tapped && (
        <div
          className="absolute z-20 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-border-strong bg-bg-card-2/95 p-4 shadow-2xl backdrop-blur"
          style={{
            left: Math.max(12, Math.min(tapped.x + 16, vw - 300)),
            top: Math.max(12, Math.min(tapped.y + 12, vh - 200)),
          }}
        >
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
                <span
                  key={fid}
                  className="rounded-full bg-bg-card px-2 py-0.5 text-[10.5px] text-text-muted"
                >
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

      {/* hint */}
      <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-bg/50 px-3.5 py-1.5 text-center text-xs text-text-dim backdrop-blur">
        drag to pan · scroll to zoom · click a node · double-click to focus
      </p>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] uppercase tracking-wide text-text-dim">{label}</div>
      {children}
    </div>
  );
}

function SwitchRow({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between py-1.5 text-left"
    >
      <span className="text-[13px] text-text">{label}</span>
      <span
        className={cn(
          'relative h-5 w-9 flex-none rounded-full transition-colors',
          on ? 'bg-teal' : 'bg-border-strong',
        )}
      >
        <span
          className={cn(
            'absolute left-0 top-0.5 h-4 w-4 rounded-full transition-transform',
            on ? 'translate-x-[18px] bg-bg' : 'translate-x-0.5 bg-text-muted',
          )}
        />
      </span>
    </button>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (v: number) => void;
}) {
  // Show the dragged value live, but only commit (which rebuilds the sim) once
  // the user pauses, so dragging stays smooth instead of rebuilding per pixel.
  const [draft, setDraft] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setDraft(value), [value]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const handle = (v: number) => {
    setDraft(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onCommit(v), 120);
  };

  return (
    <div className="my-1.5">
      <div className="mb-1 flex justify-between text-[11px] text-text-muted">
        <span>{label}</span>
        <span>{draft}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={draft}
        onChange={(e) => handle(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: TEAL }}
      />
    </div>
  );
}
