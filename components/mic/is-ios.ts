'use client';

import { useEffect, useState } from 'react';

/**
 * True on iOS (iPhone, iPod, iPad). iPadOS reports as desktop Safari
 * ("MacIntel" with touch points), so we check both. Returns false during SSR.
 *
 * iOS forces every browser onto WebKit, where the Web Speech API is a stub that
 * reports as available and starts the mic but never returns results. So the
 * in-app mic is hidden on iOS in favor of the keyboard's built-in dictation mic.
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iP(hone|od|ad)/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/**
 * Hydration-safe wrapper around {@link isIOS}. Returns false on the server and on
 * the first client render (so SSR and hydration match), then the real value after
 * mount. Use this in component render; use isIOS() directly inside effects.
 */
export function useIsIOS(): boolean {
  const [ios, setIos] = useState(false);
  useEffect(() => setIos(isIOS()), []);
  return ios;
}
