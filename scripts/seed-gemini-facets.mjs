// Facet web for the Gemini meetup account. Each topic gets 2-4 facets chosen
// so the Gemini Meetup group topics overlap heavily with each other AND
// thread out across the subject seeds (vocabulary borrowed from the
// community account: counterintuitive, thought experiment, discoveries,
// trends, forgotten, dystopia, philosophy, evolution, extremes, convergent,
// predictions). Every facet ends up on at least two topics, so nothing
// dangles in the Nest's facet web.
// Idempotent: facets matched by name, links are upserts, nothing is removed.
//
// Dry run (default):  node --env-file=.env.local scripts/seed-gemini-facets.mjs
// Execute:            node --env-file=.env.local scripts/seed-gemini-facets.mjs --write
import { createClient } from '@supabase/supabase-js';

const WRITE = process.argv.includes('--write');
const EMAIL = 'gemini@dogsled.dev';

// title -> full desired facet set (existing links are kept regardless).
const FACET_MAP = {
  // AI & Tech: the Gemini Meetup group children.
  'AI, ethics, and the future of AI': ['ethics', 'future', 'philosophy', 'predictions'],
  'Frontier models caught faking alignment in lab tests': [
    'ethics',
    'future',
    'counterintuitive',
    'thought experiment',
    'paradox',
  ],
  "Golden Gate Claude: proof we can read a model's mind": ['fun facts', 'future', 'discoveries'],
  'Hinton said radiologists would be obsolete by 2021': [
    'society',
    'paradox',
    'predictions',
    'future',
  ],
  'AI art won a state fair and lost at the copyright office': [
    'society',
    'ethics',
    'trends',
    'future',
  ],
  'ELIZA fooled people in 1966 with 200 lines of code': [
    'fun facts',
    'history',
    'counterintuitive',
    'society',
    'philosophy',
  ],
  // History
  'The Great Emu War: Australia lost twice, to birds': ['fun facts', 'history', 'counterintuitive'],
  'Cleopatra lived closer to the moon landing than to the pyramids': [
    'fun facts',
    'history',
    'counterintuitive',
  ],
  // Books
  'Frankenstein was written by a teenager on a dare': ['ethics', 'history', 'thought experiment'],
  'Fahrenheit 451 is about attention, not censorship, and Bradbury said so': [
    'dystopia',
    'society',
    'counterintuitive',
  ],
  // Movies
  "Jurassic Park's CGI holds up because there are only six minutes of it": [
    'fun facts',
    'counterintuitive',
  ],
  'Alien is a haunted house movie that happens to be in space': ['convergent', 'fun facts'],
  // TV Shows
  'Columbo shows you the killer in the first scene and still keeps the mystery': [
    'counterintuitive',
    'forgotten',
  ],
  'Andor is the rare prequel that makes the original better': [
    'dystopia',
    'society',
    'counterintuitive',
  ],
  // Music
  'Bohemian Rhapsody has no chorus and became the most streamed song of its century': [
    'fun facts',
    'trends',
  ],
  'Vinyl outsells CDs again and nobody saw it coming': ['trends', 'predictions', 'forgotten'],
  // Wildlife
  'A wandering albatross can go years without touching land': ['fun facts', 'extremes'],
  'Axolotls can regrow parts of their own brain': ['discoveries', 'future', 'evolution'],
  // Astronomy & Physics
  'A teaspoon of neutron star weighs about a billion tons': ['extremes', 'fun facts'],
  "Saturn's rings are younger than sharks": ['counterintuitive', 'fun facts'],
  // Philosophy
  'Diogenes lived in a jar to troll all of Athens, and it worked': [
    'philosophy',
    'history',
    'fun facts',
  ],
  "Pascal's wager was the first expected-value argument": [
    'philosophy',
    'thought experiment',
    'history',
  ],
  // Psychology & Behavior
  'The Dunning-Kruger effect applies most to the people quoting it': [
    'paradox',
    'counterintuitive',
    'society',
  ],
  'Losing $20 hurts about twice as much as finding $20 feels good': [
    'counterintuitive',
    'discoveries',
  ],
  // Cities & Architecture
  'Venice stands on a forest of upside-down trees': ['fun facts', 'history', 'forgotten'],
  'Why grid cities beat organic cities at everything except being loved': ['paradox', 'society'],
  // Food
  'Carrots were purple until the Dutch bred them orange': ['history', 'forgotten', 'evolution'],
  "MSG's bad reputation started with one letter to a medical journal": [
    'society',
    'counterintuitive',
  ],
  // Hobbies
  'Chess got more popular after computers beat us, not less': [
    'counterintuitive',
    'future',
    'skills',
  ],
  'Birdwatching is speedrunning for patient people': ['convergent', 'skills', 'challenges'],
  // Ideas
  'Survivorship bias: the missing bullet holes that saved WW2 bombers': [
    'counterintuitive',
    'history',
    'thought experiment',
  ],
  'The best ideas look obvious in hindsight, and that is exactly why we miss them': [
    'paradox',
    'discoveries',
    'philosophy',
  ],
  // Sports
  'Table tennis balls got bigger because TV cameras could not see them': ['fun facts', 'trends'],
  'Why left-handers are overrepresented in every dueling sport': [
    'counterintuitive',
    'evolution',
    'discoveries',
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
if (!user) throw new Error(`no ${EMAIL} user`);

const { data: topics, error: topicErr } = await supabase
  .from('topics')
  .select('id, title')
  .eq('user_id', user.id);
if (topicErr) throw topicErr;

const { data: facets, error: facetErr } = await supabase
  .from('facets')
  .select('id, name')
  .eq('user_id', user.id);
if (facetErr) throw facetErr;

const { data: links, error: linkErr } = await supabase
  .from('topic_facets')
  .select('topic_id, facet_id')
  .in(
    'topic_id',
    topics.map((t) => t.id),
  );
if (linkErr) throw linkErr;
const linked = new Set(links.map((l) => `${l.topic_id}|${l.facet_id}`));

// 1. Create any missing facets.
const wanted = Array.from(new Set(Object.values(FACET_MAP).flat()));
for (const name of wanted) {
  if (facets.some((f) => f.name === name)) continue;
  log(`create facet ${name}`);
  if (WRITE) {
    const { data: created, error } = await supabase
      .from('facets')
      .insert({ name, user_id: user.id })
      .select('id, name')
      .single();
    if (error) throw error;
    facets.push(created);
  }
}

// 2. Link topics to their facet sets.
let added = 0;
for (const [title, names] of Object.entries(FACET_MAP)) {
  const topic = topics.find((t) => t.title === title);
  if (!topic) {
    log(`TOPIC NOT FOUND (skipped): ${title}`);
    continue;
  }
  for (const name of names) {
    const facet = facets.find((f) => f.name === name);
    if (!facet) continue; // dry run before facet creation
    if (linked.has(`${topic.id}|${facet.id}`)) continue;
    log(`link ${name} -> "${title}"`);
    added += 1;
    if (WRITE) {
      const { error } = await supabase
        .from('topic_facets')
        .upsert({ topic_id: topic.id, facet_id: facet.id });
      if (error) throw error;
    }
  }
}
log(`${added} new links`);

console.log(`\nRESULT: ${WRITE ? 'EXECUTED' : 'DRY RUN ONLY (pass --write to execute)'}`);
