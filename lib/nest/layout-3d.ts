/**
 * Pure 3D layout for the Nest, the WebGL sibling of the 2D canvas sim. Takes the
 * exact same buildNestGraph() output the 2D view reads (the C.11 "never drift"
 * lock) and settles it into 3D positions with d3-force-3d, whose force API mirrors
 * the 2D d3-force setup with a z-axis added. No DOM, no three, no React: just
 * {nodes, links} in, a Map of id -> [x, y, z] out. The camera fit lives in the
 * canvas; this only decides where the nodes sit.
 */

import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  forceZ,
} from 'd3-force-3d';
import type { NestGraph, NestLink, NestNode } from './types';

export type Vec3 = [number, number, number];

const LINK = 34;

/** Render + collide radius, shared with the canvas so spheres match their spacing. */
export function radiusOf(n: Pick<NestNode, 'type' | 'degree' | 'weight'>): number {
  if (n.type === 'subject') return Math.min(8 + n.degree * 0.55, 17);
  if (n.type === 'facet') return Math.min(5 + n.degree * 0.22, 11);
  if (n.type === 'entity') return Math.min(5 + n.degree * 0.5, 13);
  if (n.type === 'subtopic') return 3.6;
  return Math.min(4 + n.degree * 0.7 + Math.sqrt(n.weight) * 1.4, 11);
}

type SimNode = {
  id: string;
  type: NestNode['type'];
  radius: number;
  x?: number;
  y?: number;
  z?: number;
};
type SimLink = { source: string; target: string; kind: NestLink['kind'] };

const endpointId = (e: NestLink['source']): string => (typeof e === 'object' ? e.id : e);

// Positions are deterministic per graph (d3-force seeds a fixed phyllotaxis, no
// randomness), so cache by graph identity. The 3D canvas unmounts on a 2D<->3D
// flip, and a reverted lens toggle hands back a previously-seen graph object; both
// then reuse the settled layout instead of re-running the tick loop. WeakMap so a
// superseded graph is collected with nothing else to free.
const layoutCache = new WeakMap<NestGraph, Map<string, Vec3>>();

/**
 * Settle the graph in 3D and return final positions by node id. Runs synchronously
 * to a fixed iteration count (Barnes-Hut octree charge keeps this cheap even at a
 * few hundred nodes) the first time it sees a graph, then serves cached positions.
 */
export function computeLayout3d(graph: NestGraph, iterations = 300): Map<string, Vec3> {
  const cached = layoutCache.get(graph);
  if (cached) return cached;

  const simNodes: SimNode[] = graph.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    radius: radiusOf(n),
  }));
  const byId = new Map(simNodes.map((n) => [n.id, n]));
  const simLinks: SimLink[] = graph.links
    .map((l) => ({ source: endpointId(l.source), target: endpointId(l.target), kind: l.kind }))
    .filter((l) => byId.has(l.source) && byId.has(l.target));

  const sim = forceSimulation<SimNode>(simNodes, 3)
    .force(
      'link',
      forceLink(simLinks)
        .id((d: SimNode) => d.id)
        .distance((l: SimLink) =>
          l.kind === 'containment' ? LINK * 0.7 : l.kind === 'resonance' ? LINK * 2.2 : LINK * 1.25,
        )
        .strength((l: SimLink) =>
          l.kind === 'containment' ? 0.7 : l.kind === 'resonance' ? 0.04 : 0.14,
        ),
    )
    .force(
      'charge',
      forceManyBody().strength((n: SimNode) => (n.type === 'subject' ? -210 : -70)),
    )
    .force('center', forceCenter(0, 0, 0))
    .force(
      'collide',
      forceCollide()
        .radius((n: SimNode) => n.radius + 3)
        .iterations(2),
    )
    .force('x', forceX(0).strength(0.02))
    .force('y', forceY(0).strength(0.02))
    .force('z', forceZ(0).strength(0.02))
    .stop();

  for (let i = 0; i < iterations; i++) sim.tick();

  const out = new Map<string, Vec3>();
  for (const n of simNodes) out.set(n.id, [n.x ?? 0, n.y ?? 0, n.z ?? 0]);
  layoutCache.set(graph, out);
  return out;
}
