'use client';

import dynamic from 'next/dynamic';

/**
 * Lazy boundary for the WebGL Nest. three.js + r3f + drei are heavy and WebGL
 * cannot server-render, so the 3D canvas is code-split (ssr: false) and only
 * pulled down when a user actually flips to 3D. The 2D path never pays for it.
 */
const Nest3DCanvas = dynamic(() => import('./nest-3d-canvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-xs text-text-dim">
      warming up the constellation…
    </div>
  ),
});

export default Nest3DCanvas;
