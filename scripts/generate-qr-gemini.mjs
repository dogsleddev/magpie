/**
 * Generates public/brand/qr-gemini.svg: the QR code for the Gemini meetup
 * direct link (magpie.wiki/gemini), plumage ink on off-white so it scans from
 * a projector. Run with: node scripts/generate-qr-gemini.mjs
 */
import QRCode from 'qrcode';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const URL = 'https://magpie.wiki/gemini';
const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'brand',
  'qr-gemini.svg',
);

const svg = await QRCode.toString(URL, {
  type: 'svg',
  errorCorrectionLevel: 'Q',
  margin: 2,
  color: {
    dark: '#0A0A09',
    light: '#F5F4EF',
  },
});

writeFileSync(OUT, svg);
console.log(`wrote ${OUT} for ${URL}`);
