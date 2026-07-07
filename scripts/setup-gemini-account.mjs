// One-time setup for the Gemini meetup presentation account:
//   1. Create the auth user gemini@dogsled.dev (email confirmed, no password:
//      login rides the passwordless service-role path, same as the demo
//      account fallback). Set GEMINI_LOGIN_PASSWORD in the env to also give
//      it a password.
//   2. Seed one subject ("AI"), the "Gemini Meetup" group topic, and its
//      first sub-topic ("AI, ethics, and the future of AI") with the ethics
//      and future facets. The rest of the nest gets fed by hand at the talk.
// Idempotent. Scoped to gemini@dogsled.dev rows only.
//
// Dry run (default):  node --env-file=.env.local scripts/setup-gemini-account.mjs
// Execute:            node --env-file=.env.local scripts/setup-gemini-account.mjs --write
import { createClient } from '@supabase/supabase-js';

const WRITE = process.argv.includes('--write');
const EMAIL = 'gemini@dogsled.dev';
const SUBJECT = 'AI';
const GROUP = 'Gemini Meetup';
const FIRST_TOPIC = 'AI, ethics, and the future of AI';
const FACETS = ['ethics', 'future'];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.log('RESULT: MISSING_ENV');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const log = (msg) => console.log(`${WRITE ? '[write]' : '[dry]'} ${msg}`);

// 1. The auth user.
const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listErr) throw listErr;
let user = list.users.find((u) => u.email === EMAIL);
if (user) {
  log(`user exists: ${EMAIL} (${user.id})`);
} else {
  log(`create user ${EMAIL} (email confirmed)`);
  if (WRITE) {
    const attrs = { email: EMAIL, email_confirm: true };
    if (process.env.GEMINI_LOGIN_PASSWORD) attrs.password = process.env.GEMINI_LOGIN_PASSWORD;
    const { data: created, error } = await supabase.auth.admin.createUser(attrs);
    if (error) throw error;
    user = created.user;
  }
}
if (user) await seedContent(user);
console.log(`\nRESULT: ${WRITE ? 'EXECUTED' : 'DRY RUN ONLY (pass --write to execute)'}`);

// Steps 2 through 4 need a real user id, so on a first dry run (no user yet)
// they are skipped entirely.
async function seedContent(user) {
  // 2. The subject.
  let { data: subjects, error: subjErr } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('user_id', user.id);
  if (subjErr) throw subjErr;
  let subject = subjects.find((s) => s.name === SUBJECT);
  if (subject) {
    log(`subject exists: ${SUBJECT} (${subject.id})`);
  } else {
    log(`create subject ${SUBJECT}`);
    if (WRITE) {
      const { data: created, error } = await supabase
        .from('subjects')
        .insert({ name: SUBJECT, position: 0, user_id: user.id })
        .select('id, name')
        .single();
      if (error) throw error;
      subject = created;
    }
  }

  // 3. The group topic and its first sub-topic.
  const { data: topics, error: topicErr } = await supabase
    .from('topics')
    .select('id, title, is_group, parent_topic_id')
    .eq('user_id', user.id);
  if (topicErr) throw topicErr;

  let group = topics.find((t) => t.title === GROUP);
  if (group) {
    log(`group exists: ${GROUP} (${group.id}), is_group=${group.is_group}`);
  } else {
    log(`create group topic ${GROUP} in ${SUBJECT}`);
    if (WRITE) {
      const { data: created, error } = await supabase
        .from('topics')
        .insert({
          title: GROUP,
          subject_id: subject.id,
          user_id: user.id,
          position: 0,
          is_group: true,
        })
        .select('id, title, is_group, parent_topic_id')
        .single();
      if (error) throw error;
      group = created;
    }
  }

  let first = topics.find((t) => t.title === FIRST_TOPIC);
  if (first) {
    log(`first topic exists: ${FIRST_TOPIC} (${first.id})`);
  } else {
    log(`create first topic "${FIRST_TOPIC}" under ${GROUP}`);
    if (WRITE) {
      const { data: created, error } = await supabase
        .from('topics')
        .insert({
          title: FIRST_TOPIC,
          subject_id: subject.id,
          user_id: user.id,
          position: 1,
          parent_topic_id: group.id,
        })
        .select('id, title')
        .single();
      if (error) throw error;
      first = created;
    }
  }

  // 4. Facets on the first topic.
  const { data: facets, error: facetErr } = await supabase
    .from('facets')
    .select('id, name')
    .eq('user_id', user.id);
  if (facetErr) throw facetErr;

  for (const name of FACETS) {
    let facet = facets.find((f) => f.name === name);
    if (facet) {
      log(`facet exists: ${name} (${facet.id})`);
    } else {
      log(`create facet ${name}`);
      if (WRITE) {
        const { data: created, error } = await supabase
          .from('facets')
          .insert({ name, user_id: user.id })
          .select('id, name')
          .single();
        if (error) throw error;
        facet = created;
      }
    }
    if (WRITE && facet && first) {
      const { error } = await supabase
        .from('topic_facets')
        .upsert({ topic_id: first.id, facet_id: facet.id });
      if (error) throw error;
      log(`link facet ${name} to "${FIRST_TOPIC}"`);
    }
  }
}
