// Duplicate-topic curation for the live community account (session 15 audit):
//   1. Five merges: the empty duplicate is deleted, its facets carry onto the
//      keeper first (links + cache cascade on delete). A loser that has picked
//      up thoughts or conversations since the audit is SKIPPED, never deleted.
//   2. Retitle the Yellowstone keeper to the punchier seed title.
//   3. Refile the Seahawks + basketball topics from Hobbies to Sports.
// Idempotent. Scoped to dogsled@dogsled.dev rows only.
//
// Dry run (default):  node --env-file=.env.local scripts/merge-dupes.mjs
// Execute:            node --env-file=.env.local scripts/merge-dupes.mjs --write
import { createClient } from '@supabase/supabase-js';

const WRITE = process.argv.includes('--write');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.log('RESULT: MISSING_ENV');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
const user = list.users.find((u) => u.email === 'dogsled@dogsled.dev');
if (!user) {
  console.log('RESULT: NO_COMMUNITY_USER');
  process.exit(1);
}

const log = (msg) => console.log(`${WRITE ? '[write]' : '[dry]'} ${msg}`);

// Ids from the session-15 read-only audit (scripts/topic-dump.mjs + counts).
const MERGES = [
  {
    label: 'High Agency (exact dupe, Psychology & Behavior)',
    keeper: '1680f45c-8fa4-4b6b-ba24-4cdbbfe16d5a',
    loser: 'be42e7bc-fef2-4994-99bf-01510a9f2969',
  },
  {
    label: 'Yellowstone wolves (Wildlife)',
    keeper: '29e6407e-3618-40f4-9ec7-302d0cc970ac',
    loser: 'f66f6586-baac-43a0-9fa8-0b3be2fa41c2',
    retitleKeeper: 'Why wolves changed the path of rivers in Yellowstone',
  },
  {
    label: 'New ideas from combining concepts (Ideas keeps, Music copy goes)',
    keeper: '80b2e5ba-885e-4f31-8575-4e1c9d5cd2b1',
    loser: '2b654556-59af-4abb-87b3-3bf6ed36de41',
  },
  {
    label: 'Claude in the terminal (AI & Tech)',
    keeper: '60545df2-9123-4a49-adc3-72cb8f2e6cbb',
    loser: 'f904c11d-4421-435c-83ac-06d7fd3fbc62',
  },
  {
    label: 'Grasshopper keeps, apprentice goes (Philosophy)',
    keeper: '6a27b5d8-52ca-4571-af49-197fb245bffd',
    loser: '6eb606c1-c767-4fa5-9741-73de8c70a252',
  },
];

const REFILES = [
  "What makes the Seattle Seahawks' playing style and culture distinctive in the NFL?",
  'What makes basketball such a compelling sport to watch and play?',
];

async function topicById(id) {
  const { data, error } = await supabase
    .from('topics')
    .select('id, title, subject_id')
    .eq('user_id', user.id)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function countRows(table, topicId) {
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('topic_id', topicId);
  if (error) throw error;
  return count ?? 0;
}

for (const m of MERGES) {
  const [keeper, loser] = await Promise.all([topicById(m.keeper), topicById(m.loser)]);
  if (!keeper) {
    log(`${m.label}: keeper NOT FOUND, skipping`);
    continue;
  }

  if (!loser) {
    log(`${m.label}: loser already gone`);
  } else {
    const [thoughts, convos] = await Promise.all([
      countRows('thoughts', loser.id),
      countRows('conversations', loser.id),
    ]);
    if (thoughts > 0 || convos > 0) {
      log(
        `${m.label}: SKIPPED, loser "${loser.title}" now has data ` +
          `(${thoughts} thoughts, ${convos} convos); re-audit before merging`,
      );
      continue;
    }

    const [{ data: keeperLinks }, { data: loserLinks }] = await Promise.all([
      supabase.from('topic_facets').select('facet_id').eq('topic_id', keeper.id),
      supabase.from('topic_facets').select('facet_id').eq('topic_id', loser.id),
    ]);
    const keeperFacets = new Set((keeperLinks ?? []).map((l) => l.facet_id));
    const carry = (loserLinks ?? []).filter((l) => !keeperFacets.has(l.facet_id));
    if (carry.length > 0) {
      log(`${m.label}: carry ${carry.length} facet link(s) onto the keeper`);
      if (WRITE) {
        const { error } = await supabase
          .from('topic_facets')
          .insert(carry.map((l) => ({ topic_id: keeper.id, facet_id: l.facet_id })));
        if (error) throw error;
      }
    }

    log(`${m.label}: delete empty duplicate "${loser.title}" (${loser.id})`);
    if (WRITE) {
      const { error } = await supabase.from('topics').delete().eq('id', loser.id);
      if (error) throw error;
    }
  }

  if (m.retitleKeeper && keeper.title !== m.retitleKeeper) {
    log(`${m.label}: retitle keeper to "${m.retitleKeeper}"`);
    if (WRITE) {
      const { error } = await supabase
        .from('topics')
        .update({ title: m.retitleKeeper })
        .eq('id', keeper.id);
      if (error) throw error;
    }
  } else if (m.retitleKeeper) {
    log(`${m.label}: keeper already retitled`);
  }
}

const { data: subjects, error: subjErr } = await supabase
  .from('subjects')
  .select('id, name')
  .eq('user_id', user.id)
  .in('name', ['Hobbies', 'Sports']);
if (subjErr) throw subjErr;
const hobbies = subjects.find((s) => s.name === 'Hobbies');
const sports = subjects.find((s) => s.name === 'Sports');
if (!hobbies || !sports) {
  log('refile: Hobbies or Sports subject missing, skipping refiles');
} else {
  const { data: lastRow, error: posErr } = await supabase
    .from('topics')
    .select('position')
    .eq('user_id', user.id)
    .eq('subject_id', sports.id)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (posErr) throw posErr;
  let nextPosition = (lastRow?.position ?? -1) + 1;

  for (const title of REFILES) {
    const { data: topic, error } = await supabase
      .from('topics')
      .select('id, title, subject_id')
      .eq('user_id', user.id)
      .eq('title', title)
      .maybeSingle();
    if (error) throw error;
    if (!topic) {
      log(`refile: NOT FOUND, skipping: "${title}"`);
      continue;
    }
    if (topic.subject_id === sports.id) {
      log(`refile: already in Sports: "${title}"`);
      continue;
    }
    log(`refile: move "${title}" to Sports at position ${nextPosition}`);
    if (WRITE) {
      const { error: moveErr } = await supabase
        .from('topics')
        .update({ subject_id: sports.id, position: nextPosition })
        .eq('id', topic.id);
      if (moveErr) throw moveErr;
    }
    nextPosition += 1;
  }
}

console.log(`\nRESULT: ${WRITE ? 'EXECUTED' : 'DRY RUN ONLY (pass --write to execute)'}`);
