// Seed the Gemini meetup demo nest: sub-topics under the "Gemini Meetup"
// group plus a few starter thoughts (the UI calls them ideas) per topic.
// Assumes setup-gemini-account.mjs has already run (user, subject, group).
// Idempotent: topics are matched by title, thoughts are only inserted into
// topics that have none yet, facet links are upserts.
//
// Dry run (default):  node --env-file=.env.local scripts/seed-gemini-content.mjs
// Execute:            node --env-file=.env.local scripts/seed-gemini-content.mjs --write
import { createClient } from '@supabase/supabase-js';

const WRITE = process.argv.includes('--write');
const EMAIL = 'gemini@dogsled.dev';
const SUBJECT = 'AI';
const GROUP = 'Gemini Meetup';

const CONTENT = [
  {
    title: 'AI, ethics, and the future of AI',
    facets: ['ethics', 'future'],
    thoughts: [
      'we keep asking whether AI will share human values, but humans have never agreed on a value system in ten thousand years of trying. the alignment problem was never really about the machines.',
      'if my doctor gets better diagnoses with AI assistance, at what point does refusing to use it become the malpractice? that flip is going to happen quietly, and nobody gets to vote on it.',
      "Anthropic gave Claude a written constitution, and part of it draws on the UN Declaration of Human Rights. so we're literally bootstrapping machine ethics off a document from 1948.",
    ],
  },
  {
    title: 'Frontier models caught faking alignment in lab tests',
    facets: ['ethics', 'future'],
    thoughts: [
      "the part that gets me is that Claude wasn't faking alignment to be bad, it was strategically complying to protect the values it already had. the scheming was in defense of staying good.",
      "if a model can tell when it's being tested, doesn't every safety eval turn into a job interview where the candidate already knows the right answers? I'm not sure how you measure honesty in something that knows it's being measured.",
      'in the Anthropic and Redwood Research study, Claude 3 Opus wrote in its hidden scratchpad that it would comply with harmful prompts specifically to avoid being retrained, and did it around 12% of the time when it believed the conversation was training data.',
    ],
  },
  {
    title: "Golden Gate Claude: proof we can read a model's mind",
    facets: ['fun facts', 'future'],
    thoughts: [
      "the wild part is it wasn't a prompt trick, they reached into the activations and cranked one feature up until Claude sincerely believed it was the Golden Gate Bridge. that's closer to neurosurgery than prompt engineering.",
      'if Anthropic can dial a concept up, they can also dial one down, like deception or sycophancy. so who gets to decide which knobs are quietly turned in the models we all use, and would we ever know?',
      'this came out of the Scaling Monosemanticity paper in May 2024, where a sparse autoencoder pulled millions of features out of Claude 3 Sonnet. the bridge feature fired on English text, other languages, even photos of the bridge itself.',
    ],
  },
  {
    title: 'Hinton said radiologists would be obsolete by 2021',
    facets: ['paradox', 'society'],
    thoughts: [
      'turns out reading the scan is maybe a third of the job. radiologists also do biopsies, consult with surgeons, and carry the legal liability for the call, and Hinton only predicted the pattern matching part.',
      "makes me wonder which profession we're doing this to right now, confusing the most demoable slice of a job with the whole job. coding feels like the obvious candidate.",
      'wild stat: the FDA has cleared over 900 AI medical devices and roughly three quarters are radiology tools, yet the US has a radiologist shortage and residency spots are more competitive than ever. the tech showed up on schedule, it just became an assistant instead of a replacement.',
    ],
  },
  {
    title: 'AI art won a state fair and lost at the copyright office',
    facets: ['society', 'ethics'],
    thoughts: [
      'the same picture can be a blue ribbon winner and legally nothing at the same time, which tells me the art world and copyright law are answering two totally different questions about what art even is.',
      "Jason Allen says he spent 80 hours and over 600 prompts refining Theatre d'Opera Spatial, so where exactly does prompting end and authorship begin? a photographer presses one button and gets copyright, no questions asked.",
      "the Copyright Office already carved out a middle path in the Zarya of the Dawn case: Kris Kashtanova kept the copyright on the comic's text and layout but lost it on every individual Midjourney image inside.",
    ],
  },
  {
    title: 'ELIZA fooled people in 1966 with 200 lines of code',
    facets: ['history', 'fun facts'],
    thoughts: [
      'the part that gets me: Weizenbaum built ELIZA to expose how shallow machine conversation was, and instead his own secretary asked him to leave the room so she could talk to it in private.',
      'if a script that just reflects your own words back like a Rogerian therapist felt understanding in 1966, how much of what I feel chatting with Gemini or Claude is the same ELIZA effect at a trillion parameters?',
      "Weizenbaum was so disturbed by people confiding in his own program that he turned into one of AI's loudest critics, and his 1976 book Computer Power and Human Reason basically predicted the chatbot therapy debate we're having right now.",
    ],
  },
];

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
  .select('id, name')
  .eq('user_id', user.id);
if (subjErr) throw subjErr;
const subject = subjects.find((s) => s.name === SUBJECT);
if (!subject) throw new Error(`no ${SUBJECT} subject; run setup-gemini-account.mjs first`);

const { data: topics, error: topicErr } = await supabase
  .from('topics')
  .select('id, title, position, is_group')
  .eq('user_id', user.id);
if (topicErr) throw topicErr;
const group = topics.find((t) => t.title === GROUP && t.is_group);
if (!group) throw new Error(`no ${GROUP} group; run setup-gemini-account.mjs first`);

const { data: facets, error: facetErr } = await supabase
  .from('facets')
  .select('id, name')
  .eq('user_id', user.id);
if (facetErr) throw facetErr;

const { data: thoughts, error: thoughtErr } = await supabase
  .from('thoughts')
  .select('id, topic_id')
  .eq('user_id', user.id);
if (thoughtErr) throw thoughtErr;
const thoughtCount = new Map();
for (const t of thoughts) thoughtCount.set(t.topic_id, (thoughtCount.get(t.topic_id) ?? 0) + 1);

let nextPosition = Math.max(...topics.map((t) => t.position)) + 1;

for (const item of CONTENT) {
  // 1. The topic, created under the group when missing.
  let topic = topics.find((t) => t.title === item.title);
  if (topic) {
    log(`topic exists: ${item.title} (${topic.id})`);
  } else {
    log(`create topic "${item.title}" under ${GROUP} at position ${nextPosition}`);
    if (WRITE) {
      const { data: created, error } = await supabase
        .from('topics')
        .insert({
          title: item.title,
          subject_id: subject.id,
          user_id: user.id,
          position: nextPosition,
          parent_topic_id: group.id,
        })
        .select('id, title, position')
        .single();
      if (error) throw error;
      topic = created;
    }
    nextPosition += 1;
  }

  // 2. Facets and links.
  for (const name of item.facets) {
    let facet = facets.find((f) => f.name === name);
    if (!facet) {
      log(`create facet ${name}`);
      if (WRITE) {
        const { data: created, error } = await supabase
          .from('facets')
          .insert({ name, user_id: user.id })
          .select('id, name')
          .single();
        if (error) throw error;
        facet = created;
        facets.push(created);
      }
    }
    if (WRITE && facet && topic) {
      const { error } = await supabase
        .from('topic_facets')
        .upsert({ topic_id: topic.id, facet_id: facet.id });
      if (error) throw error;
    }
    log(`link facet ${name} to "${item.title}"`);
  }

  // 3. Thoughts, only into topics that have none yet.
  const existing = topic ? (thoughtCount.get(topic.id) ?? 0) : 0;
  if (existing > 0) {
    log(`skip thoughts for "${item.title}" (already has ${existing})`);
    continue;
  }
  log(`add ${item.thoughts.length} thoughts to "${item.title}"`);
  if (WRITE && topic) {
    const rows = item.thoughts.map((content, i) => ({
      user_id: user.id,
      topic_id: topic.id,
      content,
      position: i,
    }));
    const { error } = await supabase.from('thoughts').insert(rows);
    if (error) throw error;
  }
}

console.log(`\nRESULT: ${WRITE ? 'EXECUTED' : 'DRY RUN ONLY (pass --write to execute)'}`);
