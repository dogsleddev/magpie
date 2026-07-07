'use client';

import { useEffect, useRef } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceRadial,
  forceX,
  forceY,
} from 'd3-force';
import type { NestGraph, NestNode } from '@/lib/nest/types';

const FACET_COLOR = '#C9C6BC';
const RES_COLOR = '#7F77DD';
const CORE = '#FBFAF6';

export type NestTapInfo = { id: string; x: number; y: number };

type Props = {
  graph: NestGraph;
  showLabels?: boolean;
  /** perpetual gentle drift (landing). When false the sim settles and stops. */
  ambient?: boolean;
  /** pan/zoom/tap. When false the canvas ignores pointers and the page scrolls through it. */
  interactive?: boolean;
  repel?: number;
  linkLen?: number;
  /** tap on a topic / sub-topic node (null = tapped empty space) */
  onTopicTap?: (info: NestTapInfo | null) => void;
  /** drive the highlight from outside (panel facet chip / subject legend). null = none. */
  externalHighlight?: { type: 'facet' | 'node'; id: string } | null;
  /** push the big subject nodes out to a ring so the interior weaves like a nest */
  subjectsOutside?: boolean;
  className?: string;
};

function baseRadius(n: NestNode): number {
  if (n.type === 'subject') return Math.min(8 + n.degree * 0.55, 17);
  if (n.type === 'facet') return Math.min(5 + n.degree * 0.22, 11);
  if (n.type === 'subtopic') return 3.6;
  return Math.min(4 + n.degree * 0.7 + Math.sqrt(n.weight) * 1.4, 11);
}

export default function NestCanvas({
  graph,
  showLabels = true,
  ambient = false,
  interactive = true,
  repel = 70,
  linkLen = 34,
  onTopicTap,
  externalHighlight = null,
  subjectsOutside = false,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  // config that can change without rebuilding the sim
  const cfg = useRef({ showLabels, onTopicTap, externalHighlight });
  cfg.current = { showLabels, onTopicTap, externalHighlight };
  // node positions preserved across graph rebuilds (facet-mode toggles)
  const positions = useRef<Map<string, { x: number; y: number }>>(new Map());
  // imperative repaint hook, so toggling Labels repaints a settled (non-ticking) graph
  const repaintRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    repaintRef.current?.();
  }, [showLabels]);

  useEffect(() => {
    repaintRef.current?.();
  }, [externalHighlight]);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    const wrapEl = wrapRef.current;
    if (!canvasEl || !wrapEl) return;
    const ctx2d = canvasEl.getContext('2d');
    if (!ctx2d) return;
    // Non-null-typed aliases so the narrowing survives into the render/handler closures.
    const canvas: HTMLCanvasElement = canvasEl;
    const wrap: HTMLDivElement = wrapEl;
    const ctx: CanvasRenderingContext2D = ctx2d;

    const nodes = graph.nodes;
    const links = graph.links;
    const byId = new Map(nodes.map((n) => [n.id, n]));

    const adj = new Map<string, Set<string>>(nodes.map((n) => [n.id, new Set<string>()]));
    for (const l of links) {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      adj.get(s)?.add(t);
      adj.get(t)?.add(s);
    }

    let DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = wrap.clientWidth || 360;
    let H = wrap.clientHeight || 480;
    const view = { scale: 1, tx: W / 2, ty: H / 2 };
    let hover: string | null = null;
    let selected: string | null = null;
    let focus: string | null = null;

    const subjectCount = nodes.filter((n) => n.type === 'subject').length || 1;

    // seed positions: radial bloom by subject so it opens arranged. With
    // subjectsOutside, subjects seed on an outer ring and topics inside it, so
    // the sim settles into a nest: big nodes on the rim, a woven interior.
    const ring = subjectsOutside ? 340 : 230;
    const innerScale = subjectsOutside ? 0.5 : 1;
    const subjAngle = new Map<string, number>();
    nodes
      .filter((n) => n.type === 'subject')
      .forEach((n, i) => subjAngle.set(n.id, (i / subjectCount) * Math.PI * 2));
    for (const n of nodes) {
      const saved = positions.current.get(n.id);
      if (saved) {
        n.x = saved.x;
        n.y = saved.y;
        continue;
      }
      if (n.type === 'subject') {
        const a = subjAngle.get(n.id) ?? 0;
        n.x = Math.cos(a) * ring;
        n.y = Math.sin(a) * ring;
      } else if (n.type === 'facet') {
        n.x = (Math.random() - 0.5) * 120;
        n.y = (Math.random() - 0.5) * 120;
      } else {
        const a = subjAngle.get(n.subjectId ?? '') ?? Math.random() * Math.PI * 2;
        n.x = Math.cos(a) * ring * innerScale + (Math.random() - 0.5) * 90;
        n.y = Math.sin(a) * ring * innerScale + (Math.random() - 0.5) * 90;
      }
    }

    const linkForce = forceLink<NestNode, (typeof links)[number]>(links)
      .id((d) => d.id)
      .distance((l) => {
        const target = l.target as NestNode;
        if (l.kind === 'containment') return target.type === 'subject' ? linkLen : linkLen * 0.55;
        if (l.kind === 'resonance') return linkLen * 2.2;
        return linkLen * 1.25;
      })
      .strength((l) =>
        l.kind === 'containment'
          ? subjectsOutside
            ? 0.5
            : 0.7
          : l.kind === 'resonance'
            ? 0.04
            : 0.14,
      );

    const sim = forceSimulation<NestNode>(nodes)
      .force('link', linkForce)
      .force(
        'charge',
        forceManyBody<NestNode>().strength((n) => (n.type === 'subject' ? -repel * 3 : -repel)),
      )
      .force('center', forceCenter(0, 0))
      .force(
        'collide',
        forceCollide<NestNode>()
          .radius((n) => baseRadius(n) + 3)
          .iterations(2),
      )
      .force(
        'radial',
        subjectsOutside
          ? forceRadial<NestNode>((n) => (n.type === 'subject' ? ring : 0), 0, 0).strength((n) =>
              n.type === 'subject' ? 0.9 : 0,
            )
          : null,
      )
      .force(
        'x',
        forceX<NestNode>(0).strength(
          subjectsOutside ? (n) => (n.type === 'subject' ? 0 : 0.04) : 0.015,
        ),
      )
      .force(
        'y',
        forceY<NestNode>(0).strength(
          subjectsOutside ? (n) => (n.type === 'subject' ? 0 : 0.04) : 0.015,
        ),
      )
      .alpha(0.6)
      .alphaTarget(ambient ? 0.015 : 0)
      .stop();

    const savePositions = () => {
      for (const n of nodes) positions.current.set(n.id, { x: n.x ?? 0, y: n.y ?? 0 });
    };

    function fitView(padding = 48) {
      if (!nodes.length) return;
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const n of nodes) {
        minX = Math.min(minX, n.x ?? 0);
        maxX = Math.max(maxX, n.x ?? 0);
        minY = Math.min(minY, n.y ?? 0);
        maxY = Math.max(maxY, n.y ?? 0);
      }
      const spanX = Math.max(1, maxX - minX);
      const spanY = Math.max(1, maxY - minY);
      view.scale = Math.max(
        0.2,
        Math.min((W - padding * 2) / spanX, (H - padding * 2) / spanY, 1.6),
      );
      view.tx = W / 2 - ((minX + maxX) / 2) * view.scale;
      view.ty = H / 2 - ((minY + maxY) / 2) * view.scale;
    }

    const toScreen = (x: number, y: number) => ({
      x: x * view.scale + view.tx,
      y: y * view.scale + view.ty,
    });

    function highlightSet(): Set<string> | null {
      if (focus) {
        const s = new Set<string>([focus]);
        adj.get(focus)?.forEach((x) => s.add(x));
        return s;
      }
      // external highlight (panel facet chip / subject legend) beats hover/selected
      const ext = cfg.current.externalHighlight;
      if (ext) {
        if (ext.type === 'facet') {
          const s = new Set<string>();
          if (byId.has(ext.id)) s.add(ext.id);
          for (const n of nodes) {
            if ((n.type === 'topic' || n.type === 'subtopic') && n.facetIds.includes(ext.id))
              s.add(n.id);
          }
          if (s.size) return s;
        } else if (byId.has(ext.id)) {
          const s = new Set<string>([ext.id]);
          adj.get(ext.id)?.forEach((x) => s.add(x));
          return s;
        }
      }
      const id = selected || hover;
      if (!id) return null;
      const s = new Set<string>([id]);
      adj.get(id)?.forEach((x) => s.add(x));
      return s;
    }
    function labelSetOf(): Set<string> | null {
      const id = focus || hover || selected;
      if (!id) return null;
      const s = new Set<string>([id]);
      const nn = adj.get(id);
      if (nn && nn.size <= 12) nn.forEach((x) => s.add(x));
      return s;
    }

    function render() {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const wash = ctx.createRadialGradient(
        W / 2,
        H * 0.42,
        0,
        W / 2,
        H * 0.42,
        Math.max(W, H) * 0.75,
      );
      wash.addColorStop(0, '#13110f');
      wash.addColorStop(1, '#0A0A09');
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, W, H);

      const hi = highlightSet();
      const bright = (id: string) => !hi || hi.has(id);
      const labelSet = labelSetOf();
      const labelsOn = cfg.current.showLabels;

      // links
      for (const l of links) {
        const s = l.source as NestNode;
        const t = l.target as NestNode;
        const a = toScreen(s.x ?? 0, s.y ?? 0);
        const b = toScreen(t.x ?? 0, t.y ?? 0);
        const on = bright(s.id) && bright(t.id);
        let col: string;
        if (l.kind === 'containment') col = s.color || t.color;
        else if (l.kind === 'resonance') col = RES_COLOR;
        else col = FACET_COLOR;
        ctx.globalAlpha = on
          ? l.kind === 'resonance'
            ? 0.2
            : l.kind === 'facet'
              ? 0.26
              : 0.34
          : hi
            ? 0.03
            : 0.06;
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // nodes
      for (const n of nodes) {
        const p = toScreen(n.x ?? 0, n.y ?? 0);
        if (p.x < -40 || p.x > W + 40 || p.y < -40 || p.y > H + 40) continue;
        const on = bright(n.id);
        const r = baseRadius(n) * (0.85 + 0.15 * view.scale);

        if (n.type === 'facet') {
          ctx.globalAlpha = on ? 0.95 : 0.18;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.PI / 4);
          ctx.strokeStyle = FACET_COLOR;
          ctx.lineWidth = 1.6;
          ctx.shadowColor = FACET_COLOR;
          ctx.shadowBlur = on ? 12 : 0;
          ctx.strokeRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6);
          ctx.restore();
          ctx.shadowBlur = 0;
        } else {
          ctx.globalAlpha = on ? 1 : 0.22;
          ctx.beginPath();
          ctx.fillStyle = n.color;
          ctx.shadowColor = n.color;
          ctx.shadowBlur = on ? (n.type === 'subject' ? 22 : 12) : 0;
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = on ? 0.9 : 0.25;
          ctx.beginPath();
          ctx.fillStyle = CORE;
          ctx.arc(p.x, p.y, Math.max(1, r * 0.32), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        const showLabel =
          labelsOn &&
          (n.type === 'subject' || (labelSet && labelSet.has(n.id)) || (view.scale > 1.6 && on));
        if (showLabel) {
          const fz = n.type === 'subject' ? 13 : n.type === 'facet' ? 11 : 11.5;
          ctx.font = `${n.type === 'subject' ? '600' : '500'} ${fz}px ${
            n.type === 'subject' ? 'Fraunces, Georgia, serif' : 'DM Sans, system-ui, sans-serif'
          }`;
          const label = n.label.length > 42 ? `${n.label.slice(0, 40)}…` : n.label;
          const tw = ctx.measureText(label).width;
          const lx = p.x + r + 5;
          if (n.type === 'subject' || (labelSet && labelSet.has(n.id))) {
            ctx.globalAlpha = on ? 0.55 : 0.18;
            ctx.fillStyle = 'rgba(10,10,9,0.7)';
            ctx.fillRect(lx - 3, p.y - fz / 2 - 2, tw + 6, fz + 4);
          }
          ctx.globalAlpha = on ? 0.96 : 0.3;
          ctx.fillStyle =
            n.type === 'subject' ? '#F5F4EF' : n.type === 'facet' ? FACET_COLOR : '#E7E5DC';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, lx, p.y);
          ctx.globalAlpha = 1;
        }
      }
    }

    function pickNode(px: number, py: number): NestNode | null {
      let best: NestNode | null = null;
      let bestD = Infinity;
      for (const n of nodes) {
        const p = toScreen(n.x ?? 0, n.y ?? 0);
        const r = baseRadius(n) * (0.85 + 0.15 * view.scale) + 6;
        const d = (p.x - px) ** 2 + (p.y - py) ** 2;
        if (d < r * r && d < bestD) {
          best = n;
          bestD = d;
        }
      }
      return best;
    }

    function setSize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = wrap!.clientWidth || W;
      H = wrap!.clientHeight || H;
      canvas!.width = Math.round(W * DPR);
      canvas!.height = Math.round(H * DPR);
      canvas!.style.width = `${W}px`;
      canvas!.style.height = `${H}px`;
    }

    repaintRef.current = render;
    sim.on('tick', () => {
      savePositions();
      render();
    });

    // prewarm silently, then frame + paint
    setSize();
    for (let i = 0; i < 70; i++) sim.tick();
    savePositions();
    fitView();
    render();
    sim.restart();

    const ro = new ResizeObserver(() => {
      setSize();
      fitView();
      render();
    });
    ro.observe(wrap);

    // interaction
    const pointers = new Map<number, { x: number; y: number }>();
    let dragNode: NestNode | null = null;
    let panning = false;
    let last: { x: number; y: number } | null = null;
    let downAt: { x: number; y: number; t: number } | null = null;
    let pinchDist = 0;
    let lastClickId: string | null = null;
    let lastClickT = 0;

    const localXY = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const zoomAt = (cx: number, cy: number, factor: number) => {
      const ns = Math.max(0.25, Math.min(view.scale * factor, 4));
      const wx = (cx - view.tx) / view.scale;
      const wy = (cy - view.ty) / view.scale;
      view.scale = ns;
      view.tx = cx - wx * ns;
      view.ty = cy - wy * ns;
    };

    const setFocus = (id: string) => {
      focus = id;
      selected = id;
      const n = byId.get(id);
      if (n) {
        view.scale = Math.min(view.scale * 1.3, 2.4);
        view.tx = W / 2 - (n.x ?? 0) * view.scale;
        view.ty = H / 2 - (n.y ?? 0) * view.scale;
      }
      render();
    };

    const onDown = (e: PointerEvent) => {
      canvas!.setPointerCapture(e.pointerId);
      const p = localXY(e);
      pointers.set(e.pointerId, p);
      downAt = { x: p.x, y: p.y, t: performance.now() };
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
        return;
      }
      const n = pickNode(p.x, p.y);
      if (n) {
        dragNode = n;
        n.fx = n.x;
        n.fy = n.y;
        sim.alphaTarget(0.2).restart();
      } else {
        panning = true;
      }
      last = p;
    };

    const onMove = (e: PointerEvent) => {
      const p = localXY(e);
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, p);
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist) zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, d / pinchDist);
        pinchDist = d;
        render();
        return;
      }
      if (dragNode) {
        dragNode.fx = (p.x - view.tx) / view.scale;
        dragNode.fy = (p.y - view.ty) / view.scale;
        return;
      }
      if (panning && last) {
        view.tx += p.x - last.x;
        view.ty += p.y - last.y;
        last = p;
        render();
        return;
      }
      const n = pickNode(p.x, p.y);
      const id = n ? n.id : null;
      if (id !== hover) {
        hover = id;
        canvas!.style.cursor = n ? 'pointer' : 'grab';
        render();
      }
    };

    const onUp = (e: PointerEvent) => {
      const p = localXY(e);
      const moved = downAt && Math.hypot(p.x - downAt.x, p.y - downAt.y) > 5;
      const quick = downAt && performance.now() - downAt.t < 350;
      if (dragNode) {
        // Always release a dragged node back to the sim (even with drift on) so
        // it never stays pinned where it was dropped.
        dragNode.fx = null;
        dragNode.fy = null;
        sim.alphaTarget(ambient ? 0.015 : 0);
      }
      if (!moved && quick && pointers.size <= 1) {
        const n = pickNode(p.x, p.y);
        if (n) onNodeClick(n, p);
        else {
          selected = null;
          focus = null;
          cfg.current.onTopicTap?.(null);
          render();
        }
      }
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchDist = 0;
      dragNode = null;
      panning = false;
      last = null;
    };

    function onNodeClick(n: NestNode, p: { x: number; y: number }) {
      const now = performance.now();
      if (lastClickId === n.id && now - lastClickT < 380) {
        setFocus(n.id);
        lastClickT = 0;
        return;
      }
      lastClickT = now;
      lastClickId = n.id;
      focus = null;
      if (n.type === 'topic' || n.type === 'subtopic') {
        selected = n.id;
        cfg.current.onTopicTap?.({ id: n.id, x: p.x, y: p.y });
      } else {
        // subject or facet: highlight its constellation
        selected = n.id;
        cfg.current.onTopicTap?.(null);
      }
      render();
    }

    if (interactive) {
      canvas.addEventListener('pointerdown', onDown);
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerup', onUp);
      canvas.addEventListener('pointercancel', onUp);
      canvas.addEventListener('wheel', onWheel, { passive: false });
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const p = localXY(e);
      zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0012));
      render();
    }

    return () => {
      repaintRef.current = null;
      sim.on('tick', null);
      sim.stop();
      ro.disconnect();
      if (interactive) {
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerup', onUp);
        canvas.removeEventListener('pointercancel', onUp);
        canvas.removeEventListener('wheel', onWheel);
      }
    };
  }, [graph, ambient, interactive, repel, linkLen, subjectsOutside]);

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ position: 'relative', touchAction: interactive ? 'none' : 'auto' }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'block',
          pointerEvents: interactive ? 'auto' : 'none',
        }}
      />
    </div>
  );
}
