// Merge duplicate entity hubs on the shared community account (dogsled@dogsled.dev).
// A merge folds a LOSER hub into a KEEPER: every glint link, every nesting edge,
// and every alias moves to the keeper, the loser's surface form is recorded as an
// entity_aliases row (this is the writer that finally turns prompt-time REUSE on:
// findOrCreateEntity resolves a future catch of the loser's name to the keeper),
// then the loser entity is deleted. Idempotent (a re-run skips a loser already gone).
//
//   node --env-file=.env.local scripts/merge-entities.mjs --detect   (read-only: candidate dupes)
//   node --env-file=.env.local scripts/merge-entities.mjs            (dry run of the curated MERGES)
//   node --env-file=.env.local scripts/merge-entities.mjs --write    (execute the curated MERGES)
//
// SAFETY: one Supabase project backs dogfood + preview + the public showcase, with
// no staging. SNAPSHOT the DB before --write. Re-pointing to the wrong keeper
// corrupts the spine. --detect and the default dry run never write.
import { createClient } from '@supabase/supabase-js';

const DETECT = process.argv.includes('--detect');
const WRITE = process.argv.includes('--write');
const DEMO_EMAIL = 'dogsled@dogsled.dev';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.log('MISSING_ENV: need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Mirrors entityKey() in lib/queries/entities.ts exactly.
const entityKey = (name) =>
  name.trim().toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').replace(/^the\s+/, '').trim();

// ---------------------------------------------------------------------------
// The curated merge list. keeper/loser are entity ids (get them from --detect).
// Keep only pairs that are the SAME concept in different surface forms. A pair
// that is a genuine broader/narrower relationship (ai vs large language models)
// is a nesting edge, NOT a merge: leave it out. Empty until curated.
// ---------------------------------------------------------------------------
const MERGES = [
  // { label: 'llms -> large language models', keeper: '...', loser: '...' },
];

const s = createClient(url, serviceKey, { auth: { persistSession: false } });
const log = (msg) => console.log(`${DETECT ? '[detect]' : WRITE ? '[write]' : '[dry]'} ${msg}`);

const { data: list, error: listErr } = await s.auth.admin.listUsers({ perPage: 1000 });
if (listErr) { console.log('ADMIN_LIST_FAILED:', listErr.message); process.exit(1); }
const user = list.users.find((u) => u.email === DEMO_EMAIL);
if (!user) { console.log('NO_DEMO_USER'); process.exit(1); }
const userId = user.id;

// --- Load the whole entity spine for this user once ---
const [{ data: entities }, { data: aliases }] = await Promise.all([
  s.from('entities').select('id, name, canonical_key').eq('user_id', userId),
  s.from('entity_aliases').select('alias_key, entity_id').eq('user_id', userId),
]);
const entIds = (entities ?? []).map((e) => e.id);

const [{ data: links }, { data: parents }] = await Promise.all([
  s.from('topic_entities').select('topic_id, entity_id').in('entity_id', entIds.length ? entIds : ['00000000-0000-0000-0000-000000000000']),
  s.from('entity_parents').select('child_entity_id, parent_entity_id'),
]);

const entById = new Map((entities ?? []).map((e) => [e.id, e]));
// glint set per entity (topic ids)
const glintsByEnt = new Map(entIds.map((id) => [id, new Set()]));
for (const l of links ?? []) glintsByEnt.get(l.entity_id)?.add(l.topic_id);
// parent adjacency among this user's entities: child -> Set(parents)
const parentsOf = new Map(entIds.map((id) => [id, new Set()]));
const entIdSet = new Set(entIds);
for (const e of parents ?? []) {
  if (entIdSet.has(e.child_entity_id) && entIdSet.has(e.parent_entity_id)) {
    parentsOf.get(e.child_entity_id)?.add(e.parent_entity_id);
  }
}
const aliasesByEnt = new Map();
for (const a of aliases ?? []) {
  if (!aliasesByEnt.has(a.entity_id)) aliasesByEnt.set(a.entity_id, []);
  aliasesByEnt.get(a.entity_id).push(a.alias_key);
}

const countOf = (id) => glintsByEnt.get(id)?.size ?? 0;
const nameOf = (id) => entById.get(id)?.name ?? '(gone)';

/** Does adding child->parent close a cycle in the current parent DAG? */
function wouldCycle(childId, parentId, adj) {
  if (childId === parentId) return true;
  const seen = new Set([parentId]);
  let frontier = [parentId];
  while (frontier.length) {
    const next = [];
    for (const node of frontier) {
      for (const p of adj.get(node) ?? []) {
        if (p === childId) return true;
        if (!seen.has(p)) { seen.add(p); next.push(p); }
      }
    }
    frontier = next;
  }
  return false;
}

// ===========================================================================
// DETECT: surface candidate duplicate pairs with evidence, read-only.
// ===========================================================================
if (DETECT) {
  console.log(`=== entity dupe detection: ${entIds.length} entities ===\n`);

  const lev = (a, b) => {
    const m = a.length, n = b.length;
    const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 0; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  };
  const singular = (k) => k.replace(/s$/, '');
  const hasParentEdge = (a, b) => parentsOf.get(a)?.has(b) || parentsOf.get(b)?.has(a);

  // A DUPLICATE is a surface-form variant of the SAME concept, which shows up in
  // the NAME, not in glint co-occurrence (two distinct entities sharing a glint is
  // normal, not duplication). So surface only name-variant pairs: one key's tokens
  // are a subset of the other's (perception / color perception), or the keys are a
  // plural/typo apart (length-guarded to kill short false pairs like heat/wheat).
  const ids = [...entIds].sort((a, b) => countOf(b) - countOf(a));
  const candidates = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i], b = ids[j];
      const ka = entById.get(a).canonical_key, kb = entById.get(b).canonical_key;
      if (!ka || !kb) continue;
      const ga = glintsByEnt.get(a), gb = glintsByEnt.get(b);
      let shared = 0;
      for (const t of ga) if (gb.has(t)) shared++;
      const tokensA = new Set(ka.split(' ')), tokensB = new Set(kb.split(' '));
      const contained = [...tokensA].every((t) => tokensB.has(t)) || [...tokensB].every((t) => tokensA.has(t));
      const sameSingular = ka !== kb && singular(ka) === singular(kb);
      const typoNear = Math.min(ka.length, kb.length) >= 6 && lev(ka, kb) <= 1;
      if (!(contained || sameSingular || typoNear)) continue;
      candidates.push({
        a, b, shared,
        flag: contained ? 'token-subset' : sameSingular ? 'plural-variant' : 'one-char-apart',
        parentEdge: hasParentEdge(a, b),
      });
    }
  }
  // Non-hierarchy first (a real merge), then by shared glints.
  candidates.sort((x, y) => Number(x.parentEdge) - Number(y.parentEdge) || y.shared - x.shared);

  if (!candidates.length) console.log('No name-variant candidate pairs. Nothing obvious to merge.');
  for (const c of candidates) {
    const flags = [c.flag, c.parentEdge ? 'HAS-PARENT-EDGE (nesting, not a dupe)' : ''].filter(Boolean).join(', ');
    console.log(`"${nameOf(c.a)}" (${countOf(c.a)}) <-> "${nameOf(c.b)}" (${countOf(c.b)})  shared=${c.shared}  [${flags}]`);
    console.log(`    ${c.a}  |  ${c.b}`);
  }
  const mergeable = candidates.filter((c) => !c.parentEdge);
  console.log(`\n${candidates.length} name-variant pair(s); ${mergeable.length} without an existing nesting edge.`);
  console.log('Curate MERGES only from pairs that are truly the SAME concept. A broader/narrower pair is a nesting edge, not a merge.');
  process.exit(0);
}

// ===========================================================================
// DRY / WRITE: apply the curated MERGES.
// ===========================================================================
console.log(`=== entity merge ${WRITE ? '(WRITE)' : '(DRY RUN)'}: ${MERGES.length} merge(s) ===\n`);

// Guard the config: no entity is both a keeper and a loser, no loser twice.
const losers = MERGES.map((m) => m.loser);
const keepers = new Set(MERGES.map((m) => m.keeper));
if (new Set(losers).size !== losers.length) { console.log('CONFIG ERROR: a loser id repeats.'); process.exit(1); }
for (const l of losers) if (keepers.has(l)) { console.log(`CONFIG ERROR: ${l} is both keeper and loser (chain merges in separate runs).`); process.exit(1); }

let didWork = false;
for (const m of MERGES) {
  const keeper = entById.get(m.keeper);
  const loser = entById.get(m.loser);
  if (!keeper) { log(`${m.label}: keeper NOT FOUND (${m.keeper}), skipping`); continue; }
  if (!loser) { log(`${m.label}: loser already merged/gone, skipping`); continue; }
  didWork = true;

  log(`MERGE "${keeper.name}" (${countOf(keeper.id)} glints) <- "${loser.name}" (${countOf(loser.id)} glints)`);

  // 1. Move glint links to the keeper (skip ones already shared).
  const keeperGlints = glintsByEnt.get(keeper.id) ?? new Set();
  const moves = [...(glintsByEnt.get(loser.id) ?? [])].filter((t) => !keeperGlints.has(t));
  const already = countOf(loser.id) - moves.length;
  log(`  + move ${moves.length} glint link(s) to keeper (${already} already shared)`);
  if (WRITE && moves.length) {
    const { error } = await s.from('topic_entities')
      .upsert(moves.map((t) => ({ topic_id: t, entity_id: keeper.id })), { onConflict: 'topic_id,entity_id', ignoreDuplicates: true });
    if (error) throw error;
  }

  // 2. Re-point nesting edges. Drop the direct keeper<->loser edge (collapse) and
  //    any edge that would close a cycle once loser folds into keeper.
  const repoint = []; // {child, parent}
  for (const p of parentsOf.get(loser.id) ?? []) {           // loser is a child: (loser -> p) becomes (keeper -> p)
    if (p === keeper.id) { log(`  . drop edge (loser -> keeper): collapses`); continue; }
    if (parentsOf.get(keeper.id)?.has(p)) continue; // keeper already has it
    if (wouldCycle(keeper.id, p, parentsOf)) { log(`  ! skip cycle: (keeper -> ${nameOf(p)})`); continue; }
    repoint.push({ child: keeper.id, parent: p });
  }
  for (const [child, ps] of parentsOf) {                     // loser is a parent: (child -> loser) becomes (child -> keeper)
    if (!ps.has(loser.id)) continue;
    if (child === keeper.id) { log(`  . drop edge (keeper -> loser): collapses`); continue; }
    if (parentsOf.get(child)?.has(keeper.id)) continue;
    if (wouldCycle(child, keeper.id, parentsOf)) { log(`  ! skip cycle: (${nameOf(child)} -> keeper)`); continue; }
    repoint.push({ child, parent: keeper.id });
  }
  for (const r of repoint) log(`  + re-point edge: (${nameOf(r.child)} -> ${nameOf(r.parent)})`);
  if (WRITE && repoint.length) {
    const { error } = await s.from('entity_parents')
      .upsert(repoint.map((r) => ({ child_entity_id: r.child, parent_entity_id: r.parent })), { onConflict: 'child_entity_id,parent_entity_id', ignoreDuplicates: true });
    if (error) throw error;
  }

  // 3. Re-point the loser's existing aliases to the keeper (else the delete
  //    cascade drops them).
  const loserAliases = aliasesByEnt.get(loser.id) ?? [];
  if (loserAliases.length) {
    log(`  + re-point ${loserAliases.length} existing alias(es) to keeper`);
    if (WRITE) {
      const { error } = await s.from('entity_aliases').update({ entity_id: keeper.id }).eq('user_id', userId).eq('entity_id', loser.id);
      if (error) throw error;
    }
  }

  // 4. Record the loser's surface form as an alias of the keeper (the reuse switch).
  const loserKey = loser.canonical_key || entityKey(loser.name);
  log(`  + write alias "${loserKey}" -> keeper`);
  if (WRITE) {
    const { error } = await s.from('entity_aliases')
      .upsert({ user_id: userId, alias_key: loserKey, entity_id: keeper.id }, { onConflict: 'user_id,alias_key' });
    if (error) throw error;
  }

  // 5. Delete the loser (cascade removes its now-copied links/edges).
  log(`  - delete entity "${loser.name}" (${loser.id})`);
  if (WRITE) {
    const { error } = await s.from('entities').delete().eq('id', loser.id).eq('user_id', userId);
    if (error) throw error;
  }
}

if (!MERGES.length) console.log('MERGES is empty. Run with --detect, then curate the list.');
else if (!didWork) console.log('\nNothing to do (all losers already merged).');
console.log(`\nRESULT: ${WRITE ? 'EXECUTED' : DETECT ? 'DETECT' : 'DRY RUN ONLY (pass --write to execute)'}`);
