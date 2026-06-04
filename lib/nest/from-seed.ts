/**
 * Adapter: STARTER_PACK -> NestSource, for the public landing embed (which can't
 * query user data). Synthesizes stable slug ids and reproduces the Red Rising
 * grouping so the landing constellation matches what a freshly seeded user sees.
 */

import type { SeedSubject } from '@/lib/seed/starter-topics';
import type { NestSource, NestSourceTopic } from './types';

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 64);
}

export function fromSeed(pack: SeedSubject[]): NestSource {
  const facetIds = new Set<string>();
  const topics: NestSourceTopic[] = [];

  for (const subject of pack) {
    const subjectId = `subj:${slug(subject.name)}`;
    for (const topic of subject.topics) {
      for (const f of topic.facets) facetIds.add(f);
      topics.push({
        id: `topic:${slug(subject.name)}-${slug(topic.title)}`,
        subjectId,
        title: topic.title,
        isGroup: !!topic.isGroup,
        parentId: topic.parentTitle ? `topic:${slug(subject.name)}-${slug(topic.parentTitle)}` : null,
        facetIds: topic.facets.map((f) => `facet:${slug(f)}`),
        weight: 0,
      });
    }
  }

  return {
    subjects: pack.map((s) => ({ id: `subj:${slug(s.name)}`, name: s.name })),
    topics,
    facets: [...facetIds].map((f) => ({ id: `facet:${slug(f)}`, name: f })),
  };
}
