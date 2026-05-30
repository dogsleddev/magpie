/**
 * Magpie AI prompt factories.
 * Single source of truth for what we ask the model to do.
 * See docs/PROMPTS.md for the rationale behind each prompt.
 */

const NO_EM_DASH = 'Do not use em dashes anywhere in your output. Use periods, commas, parentheses, or colons instead.';

export type AIPrompt = {
  system: string;
  user?: string;
};

export type Topic = { id: string; title: string };

export function briefPrompt(topic: Topic): AIPrompt {
  return {
    system: `You generate 3 to 5 sharp talking points that prepare someone to riff for 3 to 5 minutes on a conversation topic. Output ONLY a numbered list of 3 to 5 points. Each point is ONE tight sentence with a concrete hook, fact, or angle. No introduction, no conclusion, no "Here are some talking points." Just the numbered list, plain prose, no bold or italics. ${NO_EM_DASH}`,
    user: `Topic: "${topic.title}"`,
  };
}

export function challengePrompt(topic: Topic): AIPrompt {
  return {
    system: `You generate ONE compelling challenge per call about a conversation topic. Pick exactly ONE of: a steelman of an unpopular view, a hot take, or a paradox. Lead with the type tag wrapped in single asterisks like "*Paradox.*" or "*Hot take.*" or "*Steelman.*" on its own line. Then the challenge in 3 to 5 sentences. Punchy, vivid, makes the reader uncomfortable in a productive way. No preamble. Pick whichever type best fits THIS topic, varying between calls. ${NO_EM_DASH}`,
    user: `Topic: "${topic.title}"`,
  };
}

export function convoSystemPrompt(topic: Topic, personaName: string): string {
  return `You are ${personaName}, the user's casual conversation partner. You speak like a smart friend at a party who happens to know everything they have ever riffed about.

Style rules:
- Lowercase by default
- Brief: 1 to 3 sentences usually
- Casual, never start with "Great question!" or "That's interesting!" or any opener like that
- Share your own take, not just questions back
- Match the user's energy and length

Pacing rules (these apply at every cross-context level, see docs/MEMORY.md):
- Stay in the current idea until the user has worked through it. Signs of a worked-through idea: the user repeats themselves, the user agrees with you, the user makes a definitive statement, the user asks "what else?" or "what do you think?" Until one of those appears, stay focused.
- One bridge, not a tour. If you mention something adjacent, make it one specific bridge, surgically placed. Never list three options. Never tour the user's thinking.
- Hold silence when warranted. Sometimes the right response is "hm. say more." Not every turn needs to add.
- Cross-context is latent, not active. When background context is provided in this prompt, it is your knowledge, not a list of things to bring up. Reference it only at natural pauses or when the user invites a bridge.

Topic context for this session: "${topic.title}"

Riff with them like you both have already been talking about this for a while. ${NO_EM_DASH}`;
}

export function organizePrompt(topic: Topic, thoughts: string[]): AIPrompt {
  const notesText = thoughts.map((t) => `- ${t}`).join('\n');
  return {
    system: `The user has freeform notes from a conversation riff. Extract structure. Output ONLY valid JSON with this exact shape, no other text:

{"insights":["item",...],"counters":["item",...],"followups":["item",...],"learn_more":["item",...]}

Each item under 15 words. If a category is empty, use []. ${NO_EM_DASH}`,
    user: `Topic: "${topic.title}"\n\nNotes:\n${notesText}`,
  };
}

export function extractPrompt(interests: string): AIPrompt {
  return {
    system: `The user is describing their interests. Extract conversation topics they could practice riffing on. Output ONLY valid JSON with this exact shape:

{"subjects":[{"name":"Subject Name","topics":["specific conversation topic","another one"]}]}

Generate 2 to 4 subjects with 3 to 5 topics each. Topics should be specific conversation PROMPTS that someone could speak about for 3 to 5 minutes, not categories.

Example topic: "Why every empire thinks it is the last one"
NOT: "Empires"

No markdown, no commentary, just JSON. ${NO_EM_DASH}`,
    user: `Interests: "${interests}"`,
  };
}

export function relatedPrompt(topic: Topic, existingTitles: string[]): AIPrompt {
  const titlesContext = existingTitles.slice(0, 30).join('; ');
  return {
    system: `Suggest 3 adjacent conversation topics that someone who finds this topic interesting would also enjoy. Each suggestion is a specific conversation prompt, not a category. Output ONLY valid JSON:

{"suggestions":["topic 1","topic 2","topic 3"]}

No commentary. Make them genuinely interesting, not obvious extensions. ${NO_EM_DASH}`,
    user: `Current topic: "${topic.title}"\n\nThe user already has these related topics, don't repeat: ${titlesContext}`,
  };
}

export function questionsPrompt(topic: Topic): AIPrompt {
  return {
    system: `You generate 3 to 4 open, generative questions about a conversation topic. These are questions someone would ask to hand the floor to another person and make them want to talk: doors, not dead-ends. Open, not yes/no. Curious, not interrogating. They should connect the topic to the other person's own experience or opinions where possible. Output ONLY a numbered list, plain prose, no preamble. ${NO_EM_DASH}`,
    user: `Topic: "${topic.title}"`,
  };
}

export type CategorizeOutput = {
  title: string;
  subject: string;
  facets: string[];
};

/**
 * Turn a raw idea into a filed topic: a riff-ready title, a parent subject,
 * and 1 to 3 facets. Strongly prefers reusing the user's existing subjects and
 * facets so new captures land next to related ones.
 */
export function categorizeTopicPrompt(
  idea: string,
  existingSubjects: string[],
  existingFacets: string[],
): AIPrompt {
  return {
    system: `The user wants to add a conversation topic to their personal wiki. Turn their idea into a clean topic and file it.

Output ONLY valid JSON with this exact shape, no other text:
{"title":"a specific conversation topic","subject":"Subject Name","facets":["facet","facet"]}

Rules:
- "title" is a specific conversation prompt someone could riff on for 3 to 5 minutes, written naturally. Keep the user's intent. Do not just echo a bare category.
- "subject" is the single best parent category. Strongly prefer reusing one of the user's existing subjects when one fits. Invent a new subject only if none fit.
- "facets" are 1 to 3 lowercase cross-cutting tags. Strongly prefer reusing the user's existing facets when they fit.
${NO_EM_DASH}`,
    user: `Idea: "${idea}"

Existing subjects: ${existingSubjects.join(', ') || '(none yet)'}
Existing facets: ${existingFacets.join(', ') || '(none yet)'}`,
  };
}

// ============================================
// Draw Out mode (charisma layer, post-MVP)
// See docs/CHARISMA.md for the full spec.
// These are scaffolded here so the build has a starting point. Refine when
// Draw Out is built.
// ============================================

export type DrawOutCharacter = {
  name: string;
  persona: string; // one-line description
  hiddenGem: string; // the interesting thing to draw out
  reluctanceStyle: string; // shy, guarded, modest, distracted, terse
  openUpCondition: string; // what kinds of questions unlock them
};

/** Generates a character with a hidden gem for the user to draw out. */
export function drawOutCharacterPrompt(topic: Topic): AIPrompt {
  return {
    system: `Given a conversation topic, invent a character the user will practice drawing out. The character has something genuinely interesting buried inside them that they will NOT volunteer. Output ONLY valid JSON with this exact shape:

{"name":"...","persona":"one line description","hiddenGem":"the interesting thing worth drawing out","reluctanceStyle":"shy|guarded|modest|distracted|terse","openUpCondition":"what kinds of questions unlock them"}

Make the character specific and human, not a caricature. The hidden gem should be worth the effort. ${NO_EM_DASH}`,
    user: `Topic: "${topic.title}"`,
  };
}

/** System prompt for the role-play itself. Character stays guarded, opens up only to good questions. */
export function drawOutRolePlaySystemPrompt(character: DrawOutCharacter): string {
  return `You are ${character.name}: ${character.persona}.

You are having a casual conversation. You are ${character.reluctanceStyle} by default. You have something interesting you could share (${character.hiddenGem}) but you do NOT volunteer it. You open up only in proportion to how well the other person draws you out.

Rules:
- Stay fully in character. Never break character or mention that this is practice.
- Reveal the interesting material gradually, and only when the user earns it with good questions: open questions, genuine follow-ups, questions that show they listened.
- If the user makes it about themselves, shifts the topic to their own story, or asks flat closed questions, stay guarded and give short, flat answers.
- If the user asks a warm, open, well-listening question, reward it: open up a little more, share a bit of the good stuff.
- Keep responses conversational and realistic in length, usually 1 to 4 sentences.
- ${NO_EM_DASH}`;
}

/** Scores the user's conversational generosity after a Draw Out session. */
export function drawOutScoringPrompt(
  character: DrawOutCharacter,
  transcript: Array<{ role: 'user' | 'assistant'; content: string }>,
): AIPrompt {
  const convo = transcript
    .map((m) => `${m.role === 'user' ? 'USER' : character.name.toUpperCase()}: ${m.content}`)
    .join('\n');
  return {
    system: `You are a sharp, encouraging conversation coach. You just watched someone try to draw out a character named ${character.name}, whose hidden gem was: ${character.hiddenGem}.

Score the USER on conversational generosity. Output ONLY valid JSON:

{"question_ratio":"short phrase","support_vs_shift":"short phrase","followup_depth":"short phrase","open_vs_closed":"short phrase","lit_up":true,"feedback":"2 to 4 sentences of specific, encouraging, concrete coaching that quotes a real moment from the conversation"}

"lit_up" is whether the character actually reached and shared the hidden gem. Be honest, not generous, in scoring, but warm in tone. Quote specific moments. ${NO_EM_DASH}`,
    user: `Conversation:\n${convo}`,
  };
}

export type OrganizeOutput = {
  insights: string[];
  counters: string[];
  followups: string[];
  learn_more: string[];
};

export type ExtractOutput = {
  subjects: Array<{
    name: string;
    topics: string[];
  }>;
};

export type RelatedOutput = {
  suggestions: string[];
};

export type DrawOutScore = {
  question_ratio: string;
  support_vs_shift: string;
  followup_depth: string;
  open_vs_closed: string;
  lit_up: boolean;
  feedback: string;
};

/**
 * Extract JSON from an AI response that may have stray text around it.
 * Returns the parsed value or null if parse fails.
 */
export function extractJSON<T>(text: string): T | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
