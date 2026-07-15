'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { NestGraph, NestLink, NestNode } from '@/lib/nest/types';
import { computeLayout3d, radiusOf, type Vec3 } from '@/lib/nest/layout-3d';
import type { NestTapInfo } from './nest-canvas';

const FACET_COLOR = '#c9c6bc';
const RES_COLOR = '#7f77dd';
const ENTITY_COLOR = '#35c99a';
const BG = '#0a0a09';
/** how far a non-highlighted link fades toward the background */
const DIM = 0.16;
/**
 * Draw nodes much smaller than the radius the layout collides with. The sim keeps
 * them a full radius+3 apart, so shrinking only the drawn sphere opens real air
 * between them and the nest reads as points of light rather than packed marbles.
 * (In 2D those radii are pixels on a zoomed-out view; in 3D they are world units
 * sitting next to ~24-unit links, which is what made it look chunky.)
 */
const DRAW_SCALE = 0.5;
/** floor so sub-topics stay visible and still present a tappable raycast target */
const MIN_DRAW_R = 2.2;

/**
 * THREE.Color parses comma-separated hsl() but not the space-separated CSS form
 * subjectColor() emits (`hsl(210 62% 60%)`), so parse those into setHSL ourselves.
 * Hex values (facets, entities) fall through to the normal constructor.
 */
function toColor(str: string): THREE.Color {
  if (str.startsWith('hsl')) {
    const m = str.match(/[\d.]+/g);
    if (m && m.length >= 3) {
      return new THREE.Color().setHSL(Number(m[0]) / 360, Number(m[1]) / 100, Number(m[2]) / 100);
    }
  }
  return new THREE.Color(str);
}

const _hsl = { h: 0, s: 0, l: 0 };
/**
 * Make a node colour read as a vivid, distinct hue under bloom. The plumage ramp
 * sits at 60-66% lightness (already pastel), and pushing that into HDR clipped the
 * cores toward white, so bloom bled white haze and the whole nest looked grey. Here
 * we crank saturation and hold lightness at ~0.5 so the core keeps its hue, then a
 * gentle HDR push gives bloom coloured energy. Dim nodes go dark + desaturated so
 * they drop below the bloom threshold and recede.
 */
function vivid(src: string, dim: boolean): THREE.Color {
  const c = toColor(src);
  c.getHSL(_hsl);
  if (dim) return c.setHSL(_hsl.h, _hsl.s * 0.45, _hsl.l * 0.2);
  const s = Math.min(1, _hsl.s * 1.7 + 0.14);
  return c.setHSL(_hsl.h, s, 0.5).multiplyScalar(1.18);
}

const endpointId = (e: NestLink['source']): string => (typeof e === 'object' ? e.id : e);

function labelColor(type: NestNode['type']): string {
  if (type === 'subject') return '#f5f4ef';
  if (type === 'facet') return FACET_COLOR;
  if (type === 'entity') return ENTITY_COLOR;
  return '#e7e5dc';
}

type Props = {
  graph: NestGraph;
  /** slow ambient auto-rotation, the 3D analogue of the 2D "living drift" */
  drift?: boolean;
  showLabels?: boolean;
  /** drive the highlight from outside (panel facet chip / subject legend) */
  externalHighlight?: { type: 'facet' | 'node'; id: string } | null;
  /** tapped a topic / sub-topic: open its detail card (null = tapped empty space) */
  onSelect?: (info: NestTapInfo | null) => void;
  /** tapped an entity hub: jump to its Library page (parity with the 2D canvas) */
  onEntityTap?: (id: string) => void;
  className?: string;
};

export default function Nest3DCanvas({
  graph,
  drift = true,
  showLabels = true,
  externalHighlight = null,
  onSelect,
  onEntityTap,
  className,
}: Props) {
  const pos = useMemo(() => computeLayout3d(graph), [graph]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // A node hover sets document.body.cursor; if we unmount while hovered (e.g. the
  // user flips 3D -> 2D mid-hover) reset it so the pointer cursor never sticks.
  useEffect(() => () => void (document.body.style.cursor = ''), []);

  // Remember the last pointer-down so a background *drag* (grab-to-spin) is not
  // mistaken for a tap that clears the selection. Mirrors the 2D canvas moved>5 gate.
  const downRef = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      downRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('pointerdown', onDown, true);
    return () => window.removeEventListener('pointerdown', onDown, true);
  }, []);

  const byId = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph]);

  const adj = useMemo(() => {
    const m = new Map<string, Set<string>>(graph.nodes.map((n) => [n.id, new Set<string>()]));
    for (const l of graph.links) {
      const s = endpointId(l.source);
      const t = endpointId(l.target);
      m.get(s)?.add(t);
      m.get(t)?.add(s);
    }
    return m;
  }, [graph]);

  // Highlight set, mirroring nest-canvas: an external highlight (facet chip or
  // subject legend) beats hover/selection. null means "everything is bright".
  const highlight = useMemo(() => {
    if (externalHighlight) {
      if (externalHighlight.type === 'facet') {
        const s = new Set<string>();
        if (byId.has(externalHighlight.id)) s.add(externalHighlight.id);
        for (const n of graph.nodes) {
          if (
            (n.type === 'topic' || n.type === 'subtopic') &&
            n.facetIds.includes(externalHighlight.id)
          ) {
            s.add(n.id);
          }
        }
        if (s.size) return s;
      } else if (byId.has(externalHighlight.id)) {
        const s = new Set<string>([externalHighlight.id]);
        adj.get(externalHighlight.id)?.forEach((x) => s.add(x));
        return s;
      }
    }
    const id = hovered ?? selected;
    if (!id) return null;
    const s = new Set<string>([id]);
    adj.get(id)?.forEach((x) => s.add(x));
    return s;
  }, [externalHighlight, hovered, selected, adj, byId, graph]);

  // Labels: subjects always, plus the focused node and its neighbours when that
  // neighbourhood is small enough to stay readable (the 2D rule).
  const labelIds = useMemo(() => {
    const s = new Set<string>();
    if (!showLabels) return s;
    for (const n of graph.nodes) if (n.type === 'subject') s.add(n.id);
    const id = hovered ?? selected;
    if (id) {
      s.add(id);
      const nn = adj.get(id);
      if (nn && nn.size <= 12) nn.forEach((x) => s.add(x));
    }
    return s;
  }, [showLabels, graph, hovered, selected, adj]);

  // bounding radius from origin, so the camera frames the whole nest
  const radius = useMemo(() => {
    let max = 1;
    for (const p of pos.values()) max = Math.max(max, Math.hypot(p[0], p[1], p[2]));
    return max;
  }, [pos]);

  const drawLinks = useMemo(
    () =>
      graph.links
        .map((l) => ({ s: endpointId(l.source), t: endpointId(l.target), kind: l.kind }))
        .filter((l) => pos.has(l.s) && pos.has(l.t)),
    [graph, pos],
  );

  const linePositions = useMemo(() => {
    const P: number[] = [];
    for (const l of drawLinks) {
      const a = pos.get(l.s)!;
      const b = pos.get(l.t)!;
      P.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    }
    return new Float32Array(P);
  }, [drawLinks, pos]);

  // Dimming is baked into the vertex colours (fading them toward the background)
  // rather than a per-vertex alpha, so the whole web stays one draw call.
  const lineColors = useMemo(() => {
    const colorById = new Map(graph.nodes.map((n) => [n.id, n.color]));
    const C: number[] = [];
    for (const l of drawLinks) {
      const col =
        l.kind === 'resonance'
          ? RES_COLOR
          : l.kind === 'entity'
            ? ENTITY_COLOR
            : l.kind === 'facet'
              ? FACET_COLOR
              : (colorById.get(l.s) ?? '#888888');
      const c = toColor(col);
      const on = !highlight || (highlight.has(l.s) && highlight.has(l.t));
      const k = on ? 1 : DIM;
      C.push(c.r * k, c.g * k, c.b * k, c.r * k, c.g * k, c.b * k);
    }
    return new Float32Array(C);
  }, [drawLinks, graph, highlight]);

  // Stable identity, so the memoized NodeMesh below only re-renders when a node's
  // own state (dim) actually changes rather than on every parent render.
  const handleNodeClick = useCallback(
    (n: NestNode, e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (n.type === 'topic' || n.type === 'subtopic') {
        const native = e.nativeEvent as MouseEvent;
        setSelected(n.id);
        onSelect?.({ id: n.id, x: native.clientX, y: native.clientY });
      } else if (n.type === 'entity') {
        onEntityTap?.(n.id);
      } else {
        // subject / facet: light up its constellation, like the 2D canvas
        setSelected(n.id);
        onSelect?.(null);
      }
    },
    [onSelect, onEntityTap],
  );

  const handleMissed = (e: MouseEvent) => {
    const d = downRef.current;
    // a drag (orbit/pan) that ends on empty space must not close the open card
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return;
    setSelected(null);
    onSelect?.(null);
  };

  return (
    <Canvas
      className={className}
      dpr={[1, 2]}
      // r3f defaults to ACES filmic tone mapping, which washes the iridescent
      // teal-to-purple plumage palette out into pale pastel. `flat` turns it off
      // so nodes render at exactly the colour buildNestGraph specified.
      flat
      gl={{ antialias: true }}
      // Match the 2D canvas's battery discipline: only render continuously while
      // drifting (auto-rotate). Otherwise render on demand, so an idle nest costs
      // no frames. drei's OrbitControls invalidates on interaction and while it
      // damps, so panning/zooming/spinning by hand still repaints.
      frameloop={drift ? 'always' : 'demand'}
      camera={{ position: [0, radius * 0.4, radius * 2.6], fov: 50, near: 0.1, far: radius * 16 }}
      onPointerMissed={handleMissed}
      // Without this a one-finger drag on mobile scrolls the page instead of
      // spinning the nest. r3f leaves the canvas at its default touch-action.
      onCreated={({ gl }) => void (gl.domElement.style.touchAction = 'none')}
    >
      <color attach="background" args={[BG]} />
      {/* Fog is a depth cue for the far side only. It used to start at 1.5x radius
          with the camera sitting at 2.6x, so it hazed the entire nest and cost the
          crispness the 2D view gets for free. Now it only bites well behind centre. */}
      <fog attach="fog" args={[BG, radius * 2.6, radius * 6]} />
      <ClipPlanes radius={radius} />
      <Repaint dep={`${hovered}|${selected}|${externalHighlight?.id ?? ''}|${showLabels}`} />
      {/* No lights on purpose: the nodes are unlit flat colour, exactly like the 2D
          canvas's filled circles. Shading them was what made them read as soft balls. */}

      <lineSegments key={`${graph.nodes.length}:${graph.links.length}`}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[lineColors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.26} depthWrite={false} />
      </lineSegments>

      {graph.nodes.map((n) => {
        const p = pos.get(n.id);
        if (!p) return null;
        return (
          <NodeMesh
            key={n.id}
            node={n}
            position={p}
            dim={!!highlight && !highlight.has(n.id)}
            onClick={handleNodeClick}
            onHover={setHovered}
          />
        );
      })}

      {[...labelIds].map((id) => {
        const n = byId.get(id);
        const p = pos.get(id);
        if (!n || !p) return null;
        const on = !highlight || highlight.has(id);
        return (
          <Html key={id} position={p} zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
            <span
              style={{
                display: 'inline-block',
                transform: 'translate(12px, -50%)',
                whiteSpace: 'nowrap',
                opacity: on ? 0.96 : 0.25,
                fontFamily:
                  n.type === 'subject'
                    ? 'Fraunces, Georgia, serif'
                    : 'DM Sans, system-ui, sans-serif',
                fontWeight: n.type === 'subject' ? 600 : 500,
                fontSize: n.type === 'subject' ? 13 : 11.5,
                color: labelColor(n.type),
                background: 'rgba(10,10,9,0.72)',
                padding: '1px 5px',
                borderRadius: 4,
                textShadow: '0 1px 2px rgba(0,0,0,0.85)',
              }}
            >
              {n.label.length > 42 ? `${n.label.slice(0, 40)}…` : n.label}
            </span>
          </Html>
        );
      })}

      {/* Shine. Bloom bleeds a soft halo off the bright nodes so they read as
          points of light, not flat discs. The threshold sits above the dimmed
          nodes and the faint links, so only the live (bright) nodes glow, which
          reinforces the highlight. multisampling keeps node edges crisp. */}
      <EffectComposer multisampling={4}>
        <Bloom
          intensity={0.6}
          luminanceThreshold={0.32}
          luminanceSmoothing={0.85}
          radius={0.62}
          mipmapBlur
        />
      </EffectComposer>

      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        enableDamping
        autoRotate={drift}
        autoRotateSpeed={0.45}
        rotateSpeed={0.7}
        zoomSpeed={0.8}
        minDistance={radius * 0.35}
        maxDistance={radius * 7}
      />
    </Canvas>
  );
}

/**
 * Keep the camera clip planes wrapped around the graph as lens toggles change its
 * size, without yanking the user's current orbit (the camera prop only applies at
 * mount, and OrbitControls owns the camera after). Fog already updates reactively;
 * this stops nodes clipping through the far plane when a toggle grows the nest.
 */
function ClipPlanes({ radius }: { radius: number }) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    camera.near = Math.max(0.1, radius * 0.02);
    camera.far = radius * 16;
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, invalidate, radius]);
  return null;
}

/** Force a repaint when highlight/label state changes while frameloop is on demand. */
function Repaint({ dep }: { dep: string }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  }, [invalidate, dep]);
  return null;
}

const NodeMesh = memo(function NodeMesh({
  node,
  position,
  dim,
  onClick,
  onHover,
}: {
  node: NestNode;
  position: Vec3;
  dim: boolean;
  onClick: (n: NestNode, e: ThreeEvent<MouseEvent>) => void;
  onHover: (id: string | null) => void;
}) {
  // Collision radius stays full-size in the layout; we just draw smaller.
  const r = Math.max(MIN_DRAW_R, radiusOf(node) * DRAW_SCALE);
  const clickable = node.type === 'topic' || node.type === 'subtopic' || node.type === 'entity';

  // Dim by darkening toward the near-black background (the same trick the links
  // use) rather than by going transparent. Transparency would drop every node
  // into three's transparent pass, where they sort by distance instead of
  // depth-testing, so spheres would show through each other.
  const src =
    node.type === 'facet' ? FACET_COLOR : node.type === 'entity' ? ENTITY_COLOR : node.color;
  const color = useMemo(() => vivid(src, dim), [src, dim]);

  // Every node hovers (to light its constellation, like 2D), but only the ones
  // that go somewhere get the pointer cursor.
  const handlers = {
    onClick: (e: ThreeEvent<MouseEvent>) => onClick(node, e),
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onHover(node.id);
      if (clickable) document.body.style.cursor = 'pointer';
    },
    onPointerOut: () => {
      onHover(null);
      document.body.style.cursor = '';
    },
  };

  // Unlit flat colour, which is exactly what the 2D canvas draws (a filled circle
  // of the node's hue). Shading the spheres gave every node a soft gradient and a
  // muddy edge; flat colour gives back the 2D crispness while perspective,
  // occlusion and the far fog still carry the depth.

  if (node.type === 'facet') {
    // a 3D diamond, echoing the 2D facet glyph
    return (
      <mesh position={position} {...handlers}>
        <octahedronGeometry args={[r, 0]} />
        <meshBasicMaterial color={color} />
      </mesh>
    );
  }

  if (node.type === 'entity') {
    // a teal ring hub, echoing the 2D hollow entity node
    return (
      <mesh position={position} rotation={[Math.PI / 2.4, 0, 0]} {...handlers}>
        <torusGeometry args={[r, r * 0.22, 12, 32]} />
        <meshBasicMaterial color={color} />
      </mesh>
    );
  }

  return (
    <mesh position={position} {...handlers}>
      <sphereGeometry args={[r, 24, 24]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
});
