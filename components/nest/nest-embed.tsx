'use client';

import { useEffect, useMemo, useState } from 'react';
import { STARTER_PACK } from '@/lib/seed/starter-topics';
import { fromSeed } from '@/lib/nest/from-seed';
import { buildNestGraph } from '@/lib/nest/build-graph';
import NestCanvas from './nest-canvas';

/**
 * Live constellation for the landing page. Built from the static starter pack
 * (no auth), thread-mode for a calm web, gentle perpetual drift. Honors
 * prefers-reduced-motion by settling to a static frame.
 */
export default function NestEmbed() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const graph = useMemo(
    () => buildNestGraph(fromSeed(STARTER_PACK), { facetMode: 'thread', resonance: true }),
    [],
  );

  return (
    <div style={{ position: 'relative', height: 240, width: '100%' }}>
      <NestCanvas
        graph={graph}
        ambient={!reduced}
        interactive={false}
        showLabels={false}
        className="h-full w-full"
      />
    </div>
  );
}
