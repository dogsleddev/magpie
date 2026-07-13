/**
 * Minimal type shim for `d3-force-3d`, which ships no types and has no
 * `@types/d3-force-3d` on npm. Its API mirrors `d3-force` (already typed via
 * `@types/d3-force`) with a z-axis added, so we type only what `lib/nest/layout-3d.ts`
 * uses. Force configurators return `any` on purpose: the package exposes the same
 * fluent, per-force builder surface as d3-force, and reproducing all of it here
 * would be more noise than value for a contained single-caller module.
 */
declare module 'd3-force-3d' {
  export interface SimulationNode3D {
    index?: number;
    x?: number;
    y?: number;
    z?: number;
    vx?: number;
    vy?: number;
    vz?: number;
    fx?: number | null;
    fy?: number | null;
    fz?: number | null;
  }

  export interface Simulation3D<N> {
    nodes(): N[];
    nodes(nodes: N[]): this;
    force(name: string): unknown;
    force(name: string, force: unknown): this;
    alpha(): number;
    alpha(alpha: number): this;
    alphaTarget(target: number): this;
    alphaDecay(decay: number): this;
    alphaMin(min: number): this;
    velocityDecay(decay: number): this;
    tick(iterations?: number): this;
    restart(): this;
    stop(): this;
    on(type: string, listener: (() => void) | null): this;
    find(x: number, y: number, z: number, radius?: number): N | undefined;
  }

  export function forceSimulation<N extends SimulationNode3D>(
    nodes?: N[],
    numDimensions?: number,
  ): Simulation3D<N>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function forceLink(links?: unknown[]): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function forceManyBody(): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function forceCenter(x?: number, y?: number, z?: number): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function forceCollide(radius?: unknown): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function forceX(x?: unknown): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function forceY(y?: unknown): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function forceZ(z?: unknown): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function forceRadial(radius: unknown, x?: number, y?: number, z?: number): any;
}
