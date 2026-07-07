// Mirror the community account's subjects into the Gemini meetup account and
// drop 1-2 fresh seed topics into each new subject, so the demo grid and nest
// have the full spread. The existing "AI" subject is renamed to "AI & Tech"
// (the community name); the Gemini Meetup group keeps living there.
// Idempotent: subjects and topics are matched by name/title.
//
// Dry run (default):  node --env-file=.env.local scripts/seed-gemini-subjects.mjs
// Execute:            node --env-file=.env.local scripts/seed-gemini-subjects.mjs --write
import { createClient } from '@supabase/supabase-js';

const WRITE = process.argv.includes('--write');
const EMAIL = 'gemini@dogsled.dev';

// Community subject order as of 2026-07-07 (positions = array index).
const SUBJECTS = [
  'History',
  'Books',
  'AI & Tech',
  'Movies',
  'TV Shows',
  'Music',
  'Wildlife',
  'Astronomy & Physics',
  'Philosophy',
  'Psychology & Behavior',
  'Cities & Architecture',
  'Food',
  'Hobbies',
  'Ideas',
  'Sports',
];

// AI & Tech gets nothing here: the Gemini Meetup group already fills it.
const TOPICS = {
  History: [
    'The Great Emu War: Australia lost twice, to birds',
    'Cleopatra lived closer to the moon landing than to the pyramids',
  ],
  Books: [
    'Frankenstein was written by a teenager on a dare',
    'Fahrenheit 451 is about attention, not censorship, and Bradbury said so',
  ],
  Movies: [
    "Jurassic Park's CGI holds up because there are only six minutes of it",
    'Alien is a haunted house movie that happens to be in space',
  ],
  'TV Shows': [
    'Columbo shows you the killer in the first scene and still keeps the mystery',
    'Andor is the rare prequel that makes the original better',
  ],
  Music: [
    'Bohemian Rhapsody has no chorus and became the most streamed song of its century',
    'Vinyl outsells CDs again and nobody saw it coming',
  ],
  Wildlife: [
    'Axolotls can regrow parts of their own brain',
    'A wandering albatross can go years without touching land',
  ],
  'Astronomy & Physics': [
    'A teaspoon of neutron star weighs about a billion tons',
    "Saturn's rings are younger than sharks",
  ],
  Philosophy: [
    'Diogenes lived in a jar to troll all of Athens, and it worked',
    "Pascal's wager was the first expected-value argument",
  ],
  'Psychology & Behavior': [
    'The Dunning-Kruger effect applies most to the people quoting it',
    'Losing $20 hurts about twice as much as finding $20 feels good',
  ],
  'Cities & Architecture': [
    'Venice stands on a forest of upside-down trees',
    'Why grid cities beat organic cities at everything except being loved',
  ],
  Food: [
    'Carrots were purple until the Dutch bred them orange',
    "MSG's bad reputation started with one letter to a medical journal",
  ],
  Hobbies: [
    'Chess got more popular after computers beat us, not less',
    'Birdwatching is speedrunning for patient people',
  ],
  Ideas: [
    'Survivorship bias: the missing bullet holes that saved WW2 bombers',
    'The best ideas look obvious in hindsight, and that is exactly why we miss them',
  ],
  Sports: [
    'Table tennis balls got bigger because TV cameras could not see them',
    'Why left-handers are overrepresented in every dueling sport',
  ],
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.log('RESULT: MISSING_ENV');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const log = (msg) => console.log(`${WRITE ? '[write]' : '[dry]'} ${msg}`);

const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listErr) throw listErr;
const user = list.users.find((u) => u.email === EMAIL);
if (!user) throw new Error(`no ${EMAIL} user; run setup-gemini-account.mjs first`);

const { data: subjects, error: subjErr } = await supabase
  .from('subjects')
  .select('id, name, position')
  .eq('user_id', user.id);
if (subjErr) throw subjErr;

// 1. Rename the original "AI" subject to the community name.
const oldAi = subjects.find((s) => s.name === 'AI');
if (oldAi && !subjects.some((s) => s.name === 'AI & Tech')) {
  log('rename subject AI -> AI & Tech');
  if (WRITE) {
    const { error } = await supabase
      .from('subjects')
      .update({ name: 'AI & Tech' })
      .eq('id', oldAi.id);
    if (error) throw error;
  }
  oldAi.name = 'AI & Tech';
}

// 2. Mirror the community subjects (create missing, align positions).
for (const [position, name] of SUBJECTS.entries()) {
  let subject = subjects.find((s) => s.name === name);
  if (!subject) {
    log(`create subject ${name} at position ${position}`);
    if (WRITE) {
      const { data: created, error } = await supabase
        .from('subjects')
        .insert({ name, position, user_id: user.id })
        .select('id, name, position')
        .single();
      if (error) throw error;
      subjects.push(created);
    }
    continue;
  }
  if (subject.position !== position) {
    log(`move subject ${name} to position ${position} (was ${subject.position})`);
    if (WRITE) {
      const { error } = await supabase.from('subjects').update({ position }).eq('id', subject.id);
      if (error) throw error;
    }
  } else {
    log(`subject exists: ${name} (position ${position})`);
  }
}

// 3. Seed topics into each subject (skip titles that already exist).
const { data: topics, error: topicErr } = await supabase
  .from('topics')
  .select('id, title, subject_id, position')
  .eq('user_id', user.id);
if (topicErr) throw topicErr;

for (const [subjectName, titles] of Object.entries(TOPICS)) {
  const subject = subjects.find((s) => s.name === subjectName);
  if (!subject) {
    log(`SKIP topics for ${subjectName}: subject missing (dry run before create)`);
    continue;
  }
  const existing = topics.filter((t) => t.subject_id === subject.id);
  let nextPosition = existing.length ? Math.max(...existing.map((t) => t.position)) + 1 : 0;
  for (const title of titles) {
    if (topics.some((t) => t.title === title)) {
      log(`topic exists: ${title}`);
      continue;
    }
    log(`create topic "${title}" in ${subjectName} at position ${nextPosition}`);
    if (WRITE) {
      const { error } = await supabase.from('topics').insert({
        title,
        subject_id: subject.id,
        user_id: user.id,
        position: nextPosition,
      });
      if (error) throw error;
    }
    nextPosition += 1;
  }
}

console.log(`\nRESULT: ${WRITE ? 'EXECUTED' : 'DRY RUN ONLY (pass --write to execute)'}`);
