/**
 * The single source of Nest graph construction, shared by the in-app view and
 * the landing embed. Pure and environment-agnostic (no DOM, no d3): takes a
 * NestSource + options and returns {nodes, links}.
 *
 * Three edge kinds encode the three dimensions:
 *   containment  Subject -> Topic -> Sub-topic   (the structural spine)
 *   facet        the cross-subject web (bridge: facet nodes; thread: necklaces; off: hidden)
 *   resonance    faint Topic <-> Topic when they share >= N facets (emergent)
 */

import type { NestBuildOptions, NestGraph, NestLink, NestNode, NestSource } from './types';

const FACET_COLOR = '#C9C6BC'; // soft plumage white
const ENTITY_COLOR = '#35C99A'; // bright teal: the connective entity layer

/** Iridescent ramp across the teal -> blue -> purple plumage range, one hue per subject. */
export function subjectColor(index: number, total: number, light = 60, sat = 74): string {
  const hue = total <= 1 ? 200 : 150 + (282 - 150) * (index / (total - 1));
  return `hsl(${Math.round(hue)} ${sat}% ${light}%)`;
}

export function buildNestGraph(source: NestSource, options: NestBuildOptions): NestGraph {
  const { facetMode, resonance, entities = false, resonanceThreshold = 2 } = options;
  const nodes: NestNode[] = [];
  const links: NestLink[] = [];

  const subjectIndex = new Map(source.subjects.map((s, i) => [s.id, i]));
  const total = source.subjects.length;

  // Subjects
  for (const [i, s] of source.subjects.entries()) {
    const childCount = source.topics.filter((t) => t.subjectId === s.id && !t.parentId).length;
    nodes.push({
      id: s.id,
      type: 'subject',
      label: s.name,
      color: subjectColor(i, total),
      subjectId: s.id,
      parentId: null,
      facetIds: [],
      isGroup: false,
      weight: 0,
      degree: childCount,
    });
  }

  // Topics + sub-topics
  for (const t of source.topics) {
    const si = subjectIndex.get(t.subjectId) ?? 0;
    const isSub = !!t.parentId;
    nodes.push({
      id: t.id,
      type: isSub ? 'subtopic' : 'topic',
      label: t.title,
      color: subjectColor(si, total, isSub ? 66 : 60),
      subjectId: t.subjectId,
      parentId: t.parentId,
      facetIds: t.facetIds,
      isGroup: t.isGroup,
      weight: t.weight,
      degree: t.facetIds.length,
    });
  }

  // Containment spine
  for (const t of source.topics) {
    if (t.parentId) links.push({ source: t.id, target: t.parentId, kind: 'containment' });
    else links.push({ source: t.id, target: t.subjectId, kind: 'containment' });
  }

  // Facet web
  const facetName = new Map(source.facets.map((f) => [f.id, f.name]));
  const facetToTopics = new Map<string, string[]>();
  for (const t of source.topics) {
    for (const fid of t.facetIds) {
      const arr = facetToTopics.get(fid);
      if (arr) arr.push(t.id);
      else facetToTopics.set(fid, [t.id]);
    }
  }

  if (facetMode === 'bridge') {
    for (const [fid, ids] of facetToTopics) {
      nodes.push({
        id: fid,
        type: 'facet',
        label: facetName.get(fid) ?? fid,
        color: FACET_COLOR,
        subjectId: null,
        parentId: null,
        facetIds: [],
        isGroup: false,
        weight: 0,
        degree: ids.length,
      });
      for (const tid of ids) links.push({ source: tid, target: fid, kind: 'facet' });
    }
  } else if (facetMode === 'thread') {
    // thread: a necklace per facet (consecutive co-tagged topics, closed loop).
    // O(n) per facet rather than O(n^2), so it reads as a thread, not a hairball.
    for (const ids of facetToTopics.values()) {
      if (ids.length < 2) continue;
      for (let i = 0; i < ids.length; i++) {
        const a = ids[i];
        const b = ids[(i + 1) % ids.length];
        if (a !== b) links.push({ source: a, target: b, kind: 'facet' });
      }
    }
  }

  // Resonance: each topic to its strongest few partners sharing >= threshold facets.
  if (resonance) {
    const facetSets = new Map(source.topics.map((t) => [t.id, new Set(t.facetIds)]));
    const seen = new Set<string>();
    for (const a of source.topics) {
      const aSet = facetSets.get(a.id)!;
      const partners: Array<[string, number]> = [];
      for (const b of source.topics) {
        if (a.id === b.id) continue;
        let shared = 0;
        for (const f of aSet) if (facetSets.get(b.id)!.has(f)) shared++;
        if (shared >= resonanceThreshold) partners.push([b.id, shared]);
      }
      partners.sort((x, y) => y[1] - x[1]);
      for (const [bid] of partners.slice(0, 3)) {
        const key = a.id < bid ? `${a.id}|${bid}` : `${bid}|${a.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        links.push({ source: a.id, target: bid, kind: 'resonance' });
      }
    }
  }

  // Entity web: hubs that gather glints across the graph. Only an entity linking
  // >= 2 glints becomes a node, so it reads as connective tissue (a bridge), not a
  // node dangling off a single topic. Nesting edges connect hubs that both survive.
  if (entities && source.entities?.length) {
    const entityName = new Map(source.entities.map((e) => [e.id, e.name]));
    const entityToTopics = new Map<string, string[]>();
    for (const t of source.topics) {
      for (const eid of t.entityIds ?? []) {
        const arr = entityToTopics.get(eid);
        if (arr) arr.push(t.id);
        else entityToTopics.set(eid, [t.id]);
      }
    }
    const shown = new Set<string>();
    for (const [eid, ids] of entityToTopics) {
      if (ids.length < 2) continue;
      shown.add(eid);
      nodes.push({
        id: eid,
        type: 'entity',
        label: entityName.get(eid) ?? eid,
        color: ENTITY_COLOR,
        subjectId: null,
        parentId: null,
        facetIds: [],
        isGroup: false,
        weight: 0,
        degree: ids.length,
      });
      for (const tid of ids) links.push({ source: tid, target: eid, kind: 'entity' });
    }
    for (const edge of source.entityParents ?? []) {
      if (shown.has(edge.childId) && shown.has(edge.parentId)) {
        links.push({ source: edge.childId, target: edge.parentId, kind: 'entity' });
      }
    }
  }

  // Keep only links whose endpoints both exist as nodes. Belt-and-suspenders
  // against any orphaned reference (a topic's subjectId/parentId/facet id not in
  // the node set) so d3-force never throws "missing: <id>" when it initializes.
  const nodeIds = new Set(nodes.map((n) => n.id));
  const safeLinks = links.filter(
    (l) => nodeIds.has(l.source as string) && nodeIds.has(l.target as string),
  );
  return { nodes, links: safeLinks };
}
