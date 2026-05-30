// Krava functional probe: confirms real Magpie prompts produce good output through Krava.
// No secrets in this file: KRAVA_APP_KEY comes from env or .env.local.
// Usage (PowerShell): node scripts/krava-probe.mjs
import { readFileSync } from 'node:fs';

if (!process.env.KRAVA_APP_KEY) {
  try {
    const txt = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*KRAVA_APP_KEY\s*=\s*(.+?)\s*$/);
      if (m) process.env.KRAVA_APP_KEY = m[1].replace(/^["']|["']$/g, '');
    }
  } catch {}
}
const appKey = process.env.KRAVA_APP_KEY;
if (!appKey) {
  console.error('Set KRAVA_APP_KEY in .env.local first.');
  process.exit(1);
}

const { createKravaPlatformClient } = await import('@kravalabs/api-client');
const krava = createKravaPlatformClient({ appKey });
const { userToken } = await krava.users.getOrCreate('magpie-probe');
const base = process.env.KRAVA_BASE_URL ?? 'https://krava.io';

async function chat(system, message) {
  const res = await fetch(`${base}/api/platform/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ message, system }),
  });
  if (!res.ok || !res.body) return `[ERROR ${res.status}]`;
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let out = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith('data:')) continue;
      const d = t.slice(5).trim();
      if (d === '[DONE]') return out.trim();
      try {
        const j = JSON.parse(d);
        if (j.text) out += j.text;
      } catch {}
    }
  }
  return out.trim();
}

const NO_EM =
  'Do not use em dashes anywhere in your output. Use periods, commas, parentheses, or colons instead.';

console.log('\n=== BRIEF (expect a numbered list of 3 to 5 points) ===');
console.log(
  await chat(
    `You generate 3 to 5 sharp talking points that prepare someone to riff for 3 to 5 minutes on a conversation topic. Output ONLY a numbered list of 3 to 5 points. Each point is ONE tight sentence with a concrete hook, fact, or angle. No introduction, no conclusion. Just the numbered list, plain prose, no bold or italics. ${NO_EM}`,
    `Topic: "Why every empire thinks it is the last one"`,
  ),
);

console.log('\n=== CONVO (expect a casual, lowercase, 1 to 3 sentence take) ===');
console.log(
  await chat(
    `You are Magpie, the user's casual conversation partner. Lowercase by default. Brief, 1 to 3 sentences. Never start with "Great question". Share your own take, not just questions back. ${NO_EM}`,
    `User: i think high agency is just confidence plus follow-through. what do you think?`,
  ),
);
console.log('\n--- done ---');
