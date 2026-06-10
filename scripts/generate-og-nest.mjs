/**
 * Generates public/brand/og-nest.png (1200x630): the wordmark and tagline over
 * a deterministic rendering of a community-nest constellation, in the plumage
 * palette. Run with: node scripts/generate-og-nest.mjs
 */
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const W = 1200;
const H = 630;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'brand', 'og-nest.png');

// Plumage palette (styles/tokens.css)
const BG = '#0A0A09';
const TEXT = '#F5F4EF';
const TEXT_MUTED = '#A5A39A';
const TEXT_DIM = '#76746C';
const TEAL = '#1D9E75';
const BLUE = '#378ADD';
const PURPLE = '#7F77DD';

// Seeded LCG so the nest is identical on every run.
let seed = 20260609;
const rand = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const between = (a, b) => a + rand() * (b - a);

// Constellation occupies the right side; the wordmark owns the left.
const CX = 880;
const CY = 315;
const RIM = 240;
const SUBJECT_COLORS = [TEAL, BLUE, PURPLE, '#0F6E56', '#185FA5', '#534AB7'];

const subjects = Array.from({ length: 15 }, (_, i) => {
  const angle = (i / 15) * Math.PI * 2 + between(-0.12, 0.12);
  const r = RIM + between(-22, 26);
  return {
    x: CX + Math.cos(angle) * r,
    y: CY + Math.sin(angle) * r * 0.92,
    color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
  };
});

const topics = Array.from({ length: 150 }, () => {
  const s = subjects[Math.floor(rand() * subjects.length)];
  // Topics pull inward from their subject so the interior weaves like a nest.
  const t = between(0.25, 0.85);
  const jx = between(-60, 60);
  const jy = between(-55, 55);
  return {
    x: s.x + (CX - s.x) * t + jx,
    y: s.y + (CY - s.y) * t + jy,
    sx: s.x,
    sy: s.y,
    color: s.color,
    r: between(1.6, 3.4),
  };
});

let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
svg += `<rect width="${W}" height="${H}" fill="${BG}"/>`;
// Soft teal glow behind the nest
svg += `<defs>
  <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0%" stop-color="${TEAL}" stop-opacity="0.14"/>
    <stop offset="60%" stop-color="${TEAL}" stop-opacity="0.05"/>
    <stop offset="100%" stop-color="${TEAL}" stop-opacity="0"/>
  </radialGradient>
</defs>`;
svg += `<ellipse cx="${CX}" cy="${CY}" rx="430" ry="330" fill="url(#glow)"/>`;

// Containment threads: topic to its subject
for (const t of topics) {
  svg += `<line x1="${t.sx.toFixed(1)}" y1="${t.sy.toFixed(1)}" x2="${t.x.toFixed(1)}" y2="${t.y.toFixed(1)}" stroke="${t.color}" stroke-opacity="0.10" stroke-width="1"/>`;
}
// Resonance threads: a few faint cross-links between random topics
for (let i = 0; i < 36; i++) {
  const a = topics[Math.floor(rand() * topics.length)];
  const b = topics[Math.floor(rand() * topics.length)];
  svg += `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="${PURPLE}" stroke-opacity="0.07" stroke-width="1"/>`;
}
// Topic dots
for (const t of topics) {
  svg += `<circle cx="${t.x.toFixed(1)}" cy="${t.y.toFixed(1)}" r="${t.r.toFixed(1)}" fill="${t.color}" fill-opacity="${between(0.55, 0.95).toFixed(2)}"/>`;
}
// Subject nodes on the rim, with a halo
for (const s of subjects) {
  svg += `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="13" fill="${s.color}" fill-opacity="0.18"/>`;
  svg += `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="6.5" fill="${s.color}"/>`;
}

// Left text block. Georgia stands in for Fraunces; both are warm serifs.
svg += `<text x="84" y="296" font-family="Georgia, 'Times New Roman', serif" font-size="92" font-weight="500" fill="${TEXT}">Magpie<tspan fill="${TEAL}">.</tspan></text>`;
svg += `<text x="88" y="356" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="30" fill="${TEXT_MUTED}">Collect curiosities. Talk them through.</text>`;
svg += `<text x="88" y="552" font-family="'Segoe UI', Arial, sans-serif" font-size="22" fill="${TEXT_DIM}">The community nest is growing at <tspan fill="${TEAL}">magpie.wiki</tspan></text>`;
svg += `</svg>`;

mkdirSync(dirname(OUT), { recursive: true });
const png = await sharp(Buffer.from(svg)).png().toBuffer();
writeFileSync(OUT, png);
console.log(`wrote ${OUT} (${(png.length / 1024).toFixed(0)} KB)`);
