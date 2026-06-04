'use client';

import { useMemo } from 'react';
import { STARTER_PACK } from '@/lib/seed/starter-topics';
import { fromSeed } from '@/lib/nest/from-seed';
import { buildNestGraph } from '@/lib/nest/build-graph';
import NestCanvas from './nest-canvas';

/**
 * Landing-page constellation, styled like the in-app desktop Nest: subjects
 * pushed out to a ring (nest-like), the cross-subject facet web, and subject
 * labels. Settles to a static frame (no perpetual drift) so it never burns CPU
 * or janks scrolling on the marketing page. Non-interactive: the page scrolls
 * through it. Fills its parent, so the container controls the size.
 */
export default function NestEmbed() {
  const graph = useMemo(
    () => buildNestGraph(fromSeed(STARTER_PACK), { facetMode: 'bridge', resonance: true }),
    [],
  );

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <NestCanvas
        graph={graph}
        ambient={false}
        interactive={false}
        showLabels
        subjectsOutside
        className="h-full w-full"
      />
    </div>
  );
}
