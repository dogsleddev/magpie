// Backfill the entity spine onto the existing community graph (the ~168-topic
// shared account). Idempotent, additive, reversible (delete topic_entities rows).
// Dry-run by default; pass --write to execute. Optional --limit=N caps Phase B.
//   node --env-file=.env.local scripts/backfill-entities.mjs            (dry, samples 6)
//   node --env-file=.env.local scripts/backfill-entities.mjs --write    (all topics)
//
// Phase A: lift existing groups (is_group topics: Red Rising, Corvids) into
//          entities and link their children. Deterministic, zero model calls.
// Phase B: extract 1-3 entity hubs per plain topic via Haiku, reusing hubs
//          discovered so far so the graph self-densifies. Skips topics already
//          linked (re-runs only fill gaps).
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const HAIKU = 'claude-haiku-4-5-20251001';
const DEMO_EMAIL = 'dogsled@dogsled.dev';

const write = process.argv.includes('--write');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : write ? Infinity : 6;

if (!url || !serviceKey || !anthropicKey) {
  console.log('MISSING_ENV: need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY');
  process.exit(1);
}

const LENS = new Set([
  'paradox', 'philosophy', 'fun facts', 'counterintuitive', 'thought experiment',
  'history', 'discoveries', 'discovery', 'ethics', 'future', 'evolution', 'trends',
  'skills', 'convergent', 'challenges', 'forgotten', 'dystopia', 'extremes',
  'predictions', 'irony', 'tradeoff', 'cause and effect',
]);
const VACUOUS = new Set(['life', 'things', 'thing', 'the world', 'world', 'stuff', 'people', 'society', 'ideas']);

// Mirrors entityKey() in lib/queries/entities.ts exactly.
const entityKey = (name) =>
  name.trim().toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').replace(/^the\s+/, '').trim();
const isEntityLike = (name) => {
  const k = entityKey(name);
  return !!k && k.length <= 60 && !LENS.has(k) && !VACUOUS.has(k);
};

const s = createClient(url, serviceKey, { auth: { persistSession: false } });
const anthropic = new Anthropic({ apiKey: anthropicKey });

console.log(`=== entity backfill ${write ? '(WRITE)' : '(DRY RUN, sample ' + LIMIT + ')'} ===\n`);

const { data: list, error: listErr } = await s.auth.admin.listUsers({ perPage: 1000 });
if (listErr) { console.log('ADMIN_LIST_FAILED:', listErr.message); process.exit(1); }
const user = list.users.find((u) => u.email === DEMO_EMAIL);
if (!user) { console.log('NO_DEMO_USER'); process.exit(1); }
const userId = user.id;

const [{ data: topics }, { data: existing }, { data: existingLinks }] = await Promise.all([
  s.from('topics').select('id, title, is_group, parent_topic_id').eq('user_id', userId).order('position'),
  s.from('entities').select('id, name, canonical_key').eq('user_id', userId),
  s.from('topic_entities').select('topic_id'),
]);

// key -> {id,name}. Seeded with what already exists so re-runs reuse hubs.
const cache = new Map((existing ?? []).map((e) => [e.canonical_key, { id: e.id, name: e.name }]));
const linked = new Set((existingLinks ?? []).map((l) => l.topic_id));
let created = 0, links = 0;

async function findOrCreate(name) {
  const key = entityKey(name);
  if (!key || !isEntityLike(name)) return null;
  if (cache.has(key)) return cache.get(key);
  if (!write) { const stub = { id: `new:${key}`, name: name.trim() }; cache.set(key, stub); created++; return stub; }
  let { data: hit } = await s.from('entities').select('id, name').eq('user_id', userId).eq('canonical_key', key).maybeSingle();
  if (!hit) {
    const { data: ins, error } = await s.from('entities').insert({ user_id: userId, name: name.trim(), canonical_key: key }).select('id, name').single();
    if (error) {
      if (error.code === '23505') ({ data: hit } = await s.from('entities').select('id, name').eq('user_id', userId).eq('canonical_key', key).maybeSingle());
      else { console.log('  entity insert error:', error.message); return null; }
    } else { hit = ins; created++; }
  }
  cache.set(key, hit);
  return hit;
}

async function link(topicId, entityId) {
  links++;
  if (!write || String(entityId).startsWith('new:')) return;
  await s.from('topic_entities').upsert({ topic_id: topicId, entity_id: entityId }, { onConflict: 'topic_id,entity_id', ignoreDuplicates: true });
}

// --- Phase A: lift groups (deterministic) ---
const groups = (topics ?? []).filter((t) => t.is_group);
console.log(`Phase A: ${groups.length} group(s).`);
for (const g of groups) {
  const hub = await findOrCreate(g.title);
  if (!hub) continue;
  const children = (topics ?? []).filter((t) => t.parent_topic_id === g.id);
  for (const c of children) await link(c.id, hub.id);
  console.log(`  ${g.title} -> hub "${hub.name}", ${children.length} child link(s)`);
}

// --- Phase B: extract per plain topic ---
const SYSTEM = `You pull the ENTITIES out of a curiosity title. An ENTITY is a concrete NOUN it is ABOUT (a person, place, work, organism, group, field, or named thing: wolves, Yellowstone, Stoicism, Red Rising, jazz). Return the 1 to 3 MOST CENTRAL, lowercase, fewer is better, NEVER more than 3. REUSE a name from the EXISTING list verbatim when it fits. NEVER return a lens word (paradox, ethics, evolution, future, history) or a vague noun (life, things, the world, people). For "broader", give an obvious stable superset only (wolves -> predators), else null. Return STRICT JSON only: {"entities":[{"name":"noun","broader":"noun or null"}]}`;

async function extract(title) {
  try {
    const existingNames = [...cache.values()].map((e) => e.name).slice(0, 120).join(', ');
    const resp = await anthropic.messages.create({
      model: HAIKU, max_tokens: 200, system: SYSTEM,
      messages: [{ role: 'user', content: `EXISTING entities: ${existingNames || '(none yet)'}\n\nTitle: "${title}"` }],
    });
    const text = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    const m = text.match(/\{[\s\S]*\}/);
    return m ? (JSON.parse(m[0]).entities ?? []) : [];
  } catch (e) { console.log('  extract error:', String(e?.message ?? e)); return []; }
}

const plain = (topics ?? []).filter((t) => !t.is_group && !linked.has(t.id));
const todo = plain.slice(0, LIMIT === Infinity ? plain.length : LIMIT);
console.log(`\nPhase B: ${plain.length} unlinked plain topic(s), processing ${todo.length}.`);
let n = 0;
for (const t of todo) {
  const ents = (await extract(t.title)).filter((e) => e && isEntityLike(e.name)).slice(0, 3);
  const names = [];
  for (const e of ents) {
    const hub = await findOrCreate(e.name);
    if (!hub) continue;
    await link(t.id, hub.id);
    names.push(hub.name);
    if (e.broader && isEntityLike(e.broader) && write && !String(hub.id).startsWith('new:')) {
      const parent = await findOrCreate(e.broader);
      if (parent && !String(parent.id).startsWith('new:')) {
        await s.from('entity_parents').upsert({ child_entity_id: hub.id, parent_entity_id: parent.id }, { onConflict: 'child_entity_id,parent_entity_id', ignoreDuplicates: true });
      }
    }
  }
  if (++n % 20 === 0) console.log(`  ...${n}/${todo.length}`);
  if (todo.length <= 12) console.log(`  "${t.title}" -> ${names.join(', ') || '(none)'}`);
}

console.log(`\n=== ${write ? 'DONE' : 'DRY RUN'}: ${created} entities ${write ? 'created' : 'would create'}, ${links} links ${write ? 'written' : 'would write'}. ===`);
if (!write) console.log('Re-run with --write to apply (and process all topics).');
