/**
 * Nest mind-map types.
 *
 * NestSource is the normalized, serializable input that BOTH the live query
 * (lib/queries/nest.ts) and the static seed adapter (lib/nest/from-seed.ts)
 * produce. buildNestGraph() turns a NestSource into the {nodes, links} the
 * canvas renders. Keeping the source separate from the graph means the facet
 * lens (bridge vs thread) can be re-derived on the client without re-querying.
 */

export type NestFacetMode = 'bridge' | 'thread' | 'off';

export type NestSourceSubject = { id: string; name: string };
export type NestSourceTopic = {
  id: string;
  subjectId: string;
  title: string;
  isGroup: boolean;
  parentId: string | null;
  facetIds: string[];
  /** entity hub ids this glint links to. Optional: absent on seed data. */
  entityIds?: string[];
  /** Thought count, drives node size. 0 when unknown (e.g. fresh seed data). */
  weight: number;
};
export type NestSourceFacet = { id: string; name: string };
export type NestSourceEntity = { id: string; name: string };
export type NestEntityEdge = { childId: string; parentId: string };

export type NestSource = {
  subjects: NestSourceSubject[];
  topics: NestSourceTopic[];
  facets: NestSourceFacet[];
  /** entity hubs and their nesting. Optional: absent on the landing seed source. */
  entities?: NestSourceEntity[];
  entityParents?: NestEntityEdge[];
};

export type NestNodeType = 'subject' | 'topic' | 'subtopic' | 'facet' | 'entity';
export type NestLinkKind = 'containment' | 'facet' | 'resonance' | 'entity';

/** A graph node. x/y/vx/vy/fx/fy/index are added by d3-force at runtime. */
export type NestNode = {
  id: string;
  type: NestNodeType;
  label: string;
  color: string;
  subjectId: string | null;
  parentId: string | null;
  /** facet ids (topics/sub-topics only) */
  facetIds: string[];
  isGroup: boolean;
  /** raw weight (thought count) */
  weight: number;
  /** child/facet degree, set during build; drives radius alongside weight */
  degree: number;
  index?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
};

export type NestLink = {
  source: string | NestNode;
  target: string | NestNode;
  kind: NestLinkKind;
};

export type NestGraph = { nodes: NestNode[]; links: NestLink[] };

export type NestBuildOptions = {
  facetMode: NestFacetMode;
  resonance: boolean;
  /** show entity hubs (nodes that gather glints across subjects) */
  entities?: boolean;
  /** min shared facets for a resonance thread (default 2) */
  resonanceThreshold?: number;
};
