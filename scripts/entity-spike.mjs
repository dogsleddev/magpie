// READ-ONLY entity-extraction spike for the Magpie 2.0 redesign (Slice 1).
// Validates the riskiest assumption of the entity spine BEFORE any schema lands:
// does Haiku pull good ENTITY hubs out of a glint? Checks four things per glint:
//   1. the right concrete nouns (eyeball),
//   2. the <=3 cap is respected,
//   3. no LENS word (paradox, ethics, evolution...) leaks in as an entity,
//   4. an EXISTING hub is reused verbatim instead of minting a near-duplicate,
//   5. a real brain-dump splits into 2-3 glints; a single curiosity does not.
// Writes nothing. Run: node --env-file=.env.local scripts/entity-spike.mjs
import Anthropic from '@anthropic-ai/sdk';

const anthropicKey = process.env.ANTHROPIC_API_KEY;
const HAIKU = 'claude-haiku-4-5-20251001';
if (!anthropicKey) {
  console.log('MISSING_ENV: need ANTHROPIC_API_KEY');
  process.exit(1);
}

// The existing hubs a real account already has. The extractor is handed these so
// it reuses them (prompt-time dedup) instead of inventing "gray wolves" etc.
const EXISTING = [
  'wolves', 'yellowstone', 'stoicism', 'predators', 'jazz', 'octopus',
  'red rising', 'empires', 'quantum physics', 'marcus aurelius',
];

// Lens/angle words are facets, never entities. Mirrors the live facet vocabulary.
const LENS = new Set([
  'paradox', 'philosophy', 'fun facts', 'counterintuitive', 'thought experiment',
  'history', 'discoveries', 'discovery', 'ethics', 'future', 'evolution', 'trends',
  'skills', 'convergent', 'challenges', 'forgotten', 'dystopia', 'extremes',
  'predictions', 'irony', 'tradeoff', 'cause and effect',
]);
const VACUOUS = new Set(['life', 'things', 'thing', 'the world', 'world', 'stuff', 'people', 'ideas', 'society']);

// glint, and (optional) an entity we expect it to REUSE from EXISTING.
const CASES = [
  { g: 'wolves changed the shape of rivers in yellowstone', reuse: ['wolves', 'yellowstone'] },
  { g: 'the 1995 wolf reintroduction to the park', reuse: ['wolves'] },
  { g: 'the stoics on why happiness is a practice not a feeling', reuse: ['stoicism'] },
  { g: 'marcus aurelius journaled only to himself', reuse: ['marcus aurelius'] },
  { g: 'red rising worldbuilding is insane', reuse: ['red rising'] },
  { g: 'ethics of bringing back extinct species', lens: true },
  { g: 'why do empires always think they are the last one', lens: true },
  { g: 'quantum entanglement is spooky action at a distance', reuse: ['quantum physics'] },
  { g: 'loneliness might be a skill you can practice' },
  { g: 'the way jazz musicians listen to each other mid-solo', reuse: ['jazz'] },
  { g: 'the smell of rain on hot pavement' },
  { g: 'octopus camouflage, and also whether cuttlefish dream, and why we ever removed apex predators', split: true },
];

const SYSTEM = `You are Maggie, pulling the ENTITIES out of a freshly caught curiosity (a "glint").

An ENTITY is a concrete NOUN the glint is ABOUT: a person, place, work, organism, group, field, or named thing (wolves, Yellowstone, Stoicism, Red Rising, jazz). It is a hub that will gather other glints about the same thing.

Rules:
- Return the 1 to 3 MOST CENTRAL entities. Fewer is better. NEVER more than 3.
- REUSE an entity from the EXISTING list verbatim when the glint is about it, instead of inventing a near-duplicate (reuse "wolves", do not mint "gray wolves").
- NEVER return a LENS or ANGLE word (paradox, irony, ethics, evolution, future, history, trends, tradeoff, cause and effect). Those are facets, not entities.
- NEVER return a vague/vacuous noun (life, things, the world, stuff, people, society, ideas-in-the-abstract).
- For each entity, give "broader" ONLY if it is an obvious, stable superset (wolves -> predators, Yellowstone -> national parks, Marcus Aurelius -> stoicism). Otherwise null. Never force it.
- If the input clearly holds 2 or 3 DISTINCT curiosities (a brain-dump, joined by "and also" or plainly separate ideas), return them in "split": each a short glint in lowercase, with its own entities. Otherwise "split": null. Default to null; only split when it is obvious.

Return STRICT JSON only, lowercase entity names:
{"entities":[{"name":"wolves","broader":"predators"}],"split":null}
or when clearly multiple:
{"split":[{"glint":"octopus camouflage","entities":[{"name":"octopus","broader":null}]},{"glint":"...","entities":[...]}]}`;

const anthropic = new Anthropic({ apiKey: anthropicKey });

async function extract(glint) {
  try {
    const resp = await anthropic.messages.create({
      model: HAIKU,
      max_tokens: 400,
      system: SYSTEM,
      messages: [{ role: 'user', content: `EXISTING entities: ${EXISTING.join(', ')}\n\nNew glint: "${glint}"` }],
    });
    const text = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return { raw: text };
    return JSON.parse(m[0]);
  } catch (e) {
    return { error: String(e?.message ?? e) };
  }
}

console.log('=== Magpie entity-extraction spike ===');
console.log(`existing hubs offered for reuse: ${EXISTING.join(', ')}\n`);

let flags = 0;
for (const c of CASES) {
  console.log('----------------------------------------');
  console.log(`GLINT: "${c.g}"`);
  const out = await extract(c.g);
  if (out.error) { console.log('  ERROR:', out.error); flags++; continue; }
  if (out.raw) { console.log('  UNPARSED:', out.raw.slice(0, 200)); flags++; continue; }

  const ents = Array.isArray(out.entities) ? out.entities : [];
  const names = ents.map((e) => (e?.name ?? '').toLowerCase().trim()).filter(Boolean);

  if (Array.isArray(out.split)) {
    const parts = out.split.map((s) => `${s.glint} {${(s.entities ?? []).map((e) => e.name).join(', ')}}`);
    console.log('  SPLIT ->', parts.join('  ||  '));
    if (!c.split) { console.log('  ⚠ split but expected single'); flags++; }
    else console.log(`  ✓ split into ${out.split.length}`);
    continue;
  }

  console.log('  entities ->', ents.map((e) => e.broader ? `${e.name} (→ ${e.broader})` : e.name).join(', ') || '(none)');

  // automated checks
  if (c.split) { console.log('  ⚠ expected a split, got a single'); flags++; }
  if (names.length > 3) { console.log(`  ⚠ CAP: ${names.length} entities (>3)`); flags++; }
  const leaks = names.filter((n) => LENS.has(n));
  if (leaks.length) { console.log(`  ⚠ STOPLIST LEAK: lens word as entity -> ${leaks.join(', ')}`); flags++; }
  const vac = names.filter((n) => VACUOUS.has(n));
  if (vac.length) { console.log(`  ⚠ VACUOUS: ${vac.join(', ')}`); flags++; }
  if (c.reuse) {
    const missed = c.reuse.filter((r) => !names.includes(r));
    if (missed.length) { console.log(`  ⚠ REUSE MISS: expected to reuse ${missed.join(', ')} from EXISTING`); flags++; }
    else console.log(`  ✓ reused ${c.reuse.join(', ')}`);
  }
}

console.log('\n========================================');
console.log(flags === 0 ? 'RESULT: clean, no flags.' : `RESULT: ${flags} flag(s) to review above.`);
