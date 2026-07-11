// READ-ONLY connection-quality spike for Magpie 2.0 Slice-0.
// Validates the "catch -> connect" moment: given a newly caught glint, how good
// are the "this connects to X" chips against the real 168-topic community graph?
// Compares a cheap keyword/facet baseline (the instant local index) against a
// Haiku semantic match (the async enrichment). Read-only: never writes.
//
// Run: node --env-file=.env.local scripts/connection-spike.mjs
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const HAIKU = 'claude-haiku-4-5-20251001';
const DEMO_EMAIL = 'dogsled@dogsled.dev';

if (!url || !serviceKey || !anthropicKey) {
  console.log('MISSING_ENV: need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY');
  process.exit(1);
}

// A varied set of sample glints: some should connect strongly (wolves, red
// rising, seahawks), some are tiny sensory moments that may connect weakly or
// not at all (heron, petrichor). Tests both real matches and graceful "none".
const GLINTS = [
  'why do empires always think they are the last one',
  'wolves changed the rivers in yellowstone',
  'red rising worldbuilding is insane',
  'seahawks defense looked different last night',
  'high agency people just do the thing',
  'compound interest but for ideas',
  'saw a heron standing dead still on the walk',
  'the smell of rain on hot pavement',
  'overheard that loneliness is a skill issue',
  'the way jazz musicians listen to each other',
  'quantum entanglement spooky action at a distance',
  'why is teal such a calming color',
];

const STOP = new Set(('a an the of to in on at for and or but is are was were be been being that this it its as by with from about into over under why do does did just so not no how what who when where which their they them our we you your i my me').split(' '));
const toks = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));

console.log('=== Magpie 2.0 connection spike ===\n');

// --- pull the real graph via service role (read-only, like topic-dump.mjs) ---
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listErr) {
  console.log('ADMIN_LIST_FAILED:', listErr.message);
  process.exit(1);
}
const user = list.users.find((u) => u.email === DEMO_EMAIL);
if (!user) {
  console.log('NO_DEMO_USER: could not find', DEMO_EMAIL);
  process.exit(1);
}

const [{ data: topics, error: tErr }, { data: facets }, { data: links }] = await Promise.all([
  supabase.from('topics').select('id, title, is_group, parent_topic_id').eq('user_id', user.id).order('position'),
  supabase.from('facets').select('id, name').eq('user_id', user.id),
  supabase.from('topic_facets').select('topic_id, facet_id'),
]);
if (tErr || !topics) {
  console.log('READ_FAILED:', tErr?.message);
  process.exit(1);
}

const facetName = new Map((facets ?? []).map((f) => [f.id, f.name]));
const topicFacets = new Map();
for (const l of links ?? []) {
  if (!topicFacets.has(l.topic_id)) topicFacets.set(l.topic_id, []);
  const n = facetName.get(l.facet_id);
  if (n) topicFacets.get(l.topic_id).push(n);
}
const titles = topics.map((t) => t.title);
console.log(`Graph: ${topics.length} topics, ${(facets ?? []).length} facets.\n`);

// --- keyword/facet baseline (the instant local index) ---
function keywordMatches(glint) {
  const gt = new Set(toks(glint));
  const scored = topics.map((t) => {
    const hay = new Set([...toks(t.title), ...(topicFacets.get(t.id) ?? []).flatMap(toks)]);
    let score = 0;
    for (const w of gt) if (hay.has(w)) score += 2;
    // light substring bonus (title contains a glint token as a fragment)
    const titleLc = t.title.toLowerCase();
    for (const w of gt) if (w.length > 3 && titleLc.includes(w)) score += 1;
    return { title: t.title, score };
  });
  return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
}

// --- Haiku semantic match (the async enrichment, models the real chip call) ---
const anthropic = new Anthropic({ apiKey: anthropicKey });
const SYSTEM = `You are Maggie, connecting a newly caught curiosity (a "glint") to a person's existing collection of curiosities. Given the new glint and the numbered list of their existing curiosities, pick the 2 to 3 that most genuinely connect and give a 4-to-8 word reason for each. Be honest: if nothing genuinely connects, return an empty list. Never force a weak match. Use the exact existing titles. Return STRICT JSON only: {"matches":[{"title":"<exact existing title>","why":"<4-8 words>"}]}`;

const numbered = titles.map((t, i) => `${i + 1}. ${t}`).join('\n');

async function haikuMatches(glint) {
  try {
    const resp = await anthropic.messages.create({
      model: HAIKU,
      max_tokens: 300,
      system: SYSTEM,
      messages: [{ role: 'user', content: `New glint: "${glint}"\n\nExisting curiosities:\n${numbered}` }],
    });
    const text = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return { raw: text, matches: null };
    return JSON.parse(m[0]);
  } catch (e) {
    return { error: String(e?.message ?? e), matches: null };
  }
}

for (const glint of GLINTS) {
  console.log(`\n----------------------------------------`);
  console.log(`GLINT: "${glint}"`);
  const kw = keywordMatches(glint);
  console.log(`  keyword/facet -> ${kw.length ? kw.map((k) => `${k.title} (${k.score})`).join(' | ') : '(nothing)'}`);
  const hk = await haikuMatches(glint);
  if (hk.error) console.log(`  haiku -> ERROR: ${hk.error}`);
  else if (!hk.matches) console.log(`  haiku -> UNPARSED: ${(hk.raw ?? '').slice(0, 160)}`);
  else if (hk.matches.length === 0) console.log(`  haiku -> (none, honest no-match)`);
  else console.log(`  haiku -> ${hk.matches.map((m) => `${m.title} [${m.why}]`).join(' | ')}`);
}

console.log(`\n=== done ===`);
