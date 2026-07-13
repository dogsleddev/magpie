'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { NestGraph, NestLink, NestNode } from '@/lib/nest/types';
import { computeLayout3d, radiusOf, type Vec3 } from '@/lib/nest/layout-3d';
import type { NestTapInfo } from './nest-canvas';

const FACET_COLOR = '#c9c6bc';
const RES_COLOR = '#7f77dd';
const ENTITY_COLOR = '#35c99a';
const BG = '#0a0a09';

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

const endpointId = (e: NestLink['source']): string => (typeof e === 'object' ? e.id : e);

type Props = {
  graph: NestGraph;
  /** slow ambient auto-rotation, the 3D analogue of the 2D "living drift" */
  drift?: boolean;
  /** tapped a topic / sub-topic: open its detail card (null = tapped empty space) */
  onSelect?: (info: NestTapInfo | null) => void;
  /** tapped an entity hub: jump to its Library page (parity with the 2D canvas) */
  onEntityTap?: (id: string) => void;
  className?: string;
};

export default function Nest3DCanvas({
  graph,
  drift = true,
  onSelect,
  onEntityTap,
  className,
}: Props) {
  const pos = useMemo(() => computeLayout3d(graph), [graph]);

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

  // bounding radius from origin, so the camera frames the whole nest
  const radius = useMemo(() => {
    let max = 1;
    for (const p of pos.values()) max = Math.max(max, Math.hypot(p[0], p[1], p[2]));
    return max;
  }, [pos]);

  // one merged line buffer for all links, coloured per link kind
  const lines = useMemo(() => {
    const colorById = new Map(graph.nodes.map((n) => [n.id, n.color]));
    const P: number[] = [];
    const C: number[] = [];
    for (const l of graph.links) {
      const a = pos.get(endpointId(l.source));
      const b = pos.get(endpointId(l.target));
      if (!a || !b) continue;
      P.push(a[0], a[1], a[2], b[0], b[1], b[2]);
      const col =
        l.kind === 'resonance'
          ? RES_COLOR
          : l.kind === 'entity'
            ? ENTITY_COLOR
            : l.kind === 'facet'
              ? FACET_COLOR
              : (colorById.get(endpointId(l.source)) ?? '#888888');
      const c = toColor(col);
      C.push(c.r, c.g, c.b, c.r, c.g, c.b);
    }
    return {
      positions: new Float32Array(P),
      colors: new Float32Array(C),
      key: `${graph.nodes.length}:${graph.links.length}`,
    };
  }, [graph, pos]);

  const handleNodeClick = (n: NestNode, e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (n.type === 'topic' || n.type === 'subtopic') {
      const native = e.nativeEvent as MouseEvent;
      onSelect?.({ id: n.id, x: native.clientX, y: native.clientY });
    } else if (n.type === 'entity') {
      onEntityTap?.(n.id);
    }
  };

  const handleMissed = (e: MouseEvent) => {
    const d = downRef.current;
    // a drag (orbit/pan) that ends on empty space must not close the open card
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return;
    onSelect?.(null);
  };

  return (
    <Canvas
      className={className}
      dpr={[1, 2]}
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
      <fog attach="fog" args={[BG, radius * 1.5, radius * 4.4]} />
      <ClipPlanes radius={radius} />
      <hemisphereLight args={['#fbfaf6', '#0a0a09', 0.65]} />
      <directionalLight position={[radius, radius * 1.4, radius * 1.2]} intensity={0.8} />

      <lineSegments key={lines.key}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[lines.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[lines.colors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.32} depthWrite={false} />
      </lineSegments>

      {graph.nodes.map((n) => {
        const p = pos.get(n.id);
        if (!p) return null;
        return <NodeMesh key={n.id} node={n} position={p} onClick={handleNodeClick} />;
      })}

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

function NodeMesh({
  node,
  position,
  onClick,
}: {
  node: NestNode;
  position: Vec3;
  onClick: (n: NestNode, e: ThreeEvent<MouseEvent>) => void;
}) {
  const r = radiusOf(node);
  const interactive =
    node.type === 'topic' || node.type === 'subtopic' || node.type === 'entity';
  const color = useMemo(() => toColor(node.color), [node.color]);

  const handlers = interactive
    ? {
        onClick: (e: ThreeEvent<MouseEvent>) => onClick(node, e),
        onPointerOver: (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        },
        onPointerOut: () => {
          document.body.style.cursor = '';
        },
      }
    : {};

  if (node.type === 'facet') {
    // a 3D diamond, echoing the 2D facet glyph
    return (
      <mesh position={position}>
        <octahedronGeometry args={[r, 0]} />
        <meshStandardMaterial
          color={FACET_COLOR}
          emissive={FACET_COLOR}
          emissiveIntensity={0.35}
          roughness={0.6}
        />
      </mesh>
    );
  }

  if (node.type === 'entity') {
    // a teal ring hub, echoing the 2D hollow entity node
    return (
      <mesh position={position} rotation={[Math.PI / 2.4, 0, 0]} {...handlers}>
        <torusGeometry args={[r, r * 0.22, 10, 28]} />
        <meshStandardMaterial
          color={ENTITY_COLOR}
          emissive={ENTITY_COLOR}
          emissiveIntensity={0.6}
          roughness={0.5}
        />
      </mesh>
    );
  }

  return (
    <mesh position={position} {...handlers}>
      <sphereGeometry args={[r, 22, 22]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={node.type === 'subject' ? 0.7 : 0.5}
        roughness={0.45}
        metalness={0.05}
      />
    </mesh>
  );
}
