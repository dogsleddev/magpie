/**
 * Draw Out preview script.
 * The seeded conversation for the Draw Out feature preview, accessible from
 * the home grid Draw Out tile. This is a scripted character (Diane, retired
 * air traffic controller) who responds to user messages based on keyword/
 * sequence matching. After ~6 user messages, the "Wrap session" button
 * appears, leading to a pre-written score card.
 *
 * This is the live preview of the Phase 11 flagship Draw Out mode. See
 * docs/CHARISMA.md for the full feature spec.
 *
 * Replace with real character + scoring AI calls when Draw Out is promoted
 * to Tier 1.
 */

export const DIANE_PERSONA = {
  name: 'Diane',
  description: 'Retired air traffic controller, 30 years at LAX. Quiet. Has stories she rarely tells. Lights up when someone asks the right kind of question.',
  openingMessage:
    "hi. they said i'd be talking with someone today. i'm diane. i guess we should get started.",
};

export type ScriptResponse = {
  match: (userMessage: string, turnNumber: number) => boolean;
  response: string;
};

/**
 * Ordered list of response patterns. The first match wins.
 * Patterns later in the list are more specific or appear later in the conversation.
 */
export const DIANE_SCRIPT: ScriptResponse[] = [
  // Opening greetings
  {
    match: (msg, turn) => turn === 1 && /\b(hi|hello|hey|nice|meet)\b/i.test(msg),
    response: "you too. i'm not great at small talk, so we can skip ahead if you want.",
  },

  // Asking what she did
  {
    match: (msg) => /\b(what.*do|job|work|career|controller|tower)\b/i.test(msg),
    response: "thirty years at LAX tower. you watch a lot of planes. you keep them from each other. that's most of it.",
  },

  // Asking about a specific moment or memory
  {
    match: (msg) => /\b(moment|memory|remember|story|time when|happened)\b/i.test(msg),
    response: "there was a night in 1997. the weather was bad, we had 14 planes in the pattern, one had a hydraulic issue. that's the one i remember most.",
  },

  // Asking a follow-up about the 1997 night
  {
    match: (msg, turn) => turn >= 3 && /\b(hydraulic|landed|happened|then|after|crash)\b/i.test(msg),
    response: "we got them all down. the hydraulic plane went around twice, finally came in on a foamed runway. nobody died. i went home and did not sleep for two days.",
  },

  // Asking what it felt like
  {
    match: (msg) => /\b(feel|felt|scared|hard|stress|emotion)\b/i.test(msg),
    response: "you don't feel anything during. that's the trick. you feel everything after. i still dream about that night.",
  },

  // Asking about retirement, present life
  {
    match: (msg) => /\b(now|retire|garden|family|day|since)\b/i.test(msg),
    response: "i have grandkids. two of them. i'm teaching the older one chess. she beats me sometimes now.",
  },

  // Open philosophical / "what did you learn"
  {
    match: (msg) => /\b(learn|lesson|wisdom|advice|life)\b/i.test(msg),
    response: "you can hold more than you think you can. and then you put it down, and it surprises you how heavy it was.",
  },

  // User pivots to themselves (conversational narcissism check, Diane stays gracious)
  {
    match: (msg) => /\b(i|me|my)\s/i.test(msg) && msg.length > 80,
    response: "tell me more about that. i'm listening.",
  },

  // Short acknowledgments that hold space
  {
    match: (msg) => msg.length < 30,
    response: "go on.",
  },

  // Generic fallback (kept warm)
  {
    match: () => true,
    response: "hmm. say more.",
  },
];

/**
 * The score card that appears after ~6 user messages, when the user taps
 * "Wrap session." Pre-written, varies based on rough conversation shape.
 */
export const DIANE_SCORE_CARD = {
  headline: "you did right by Diane.",
  scores: [
    { label: 'Question ratio', value: '5 of 6 messages', note: 'you asked more than you told' },
    { label: 'Support vs shift', value: 'held the floor', note: 'you stayed with her, did not pivot to yourself' },
    { label: 'Follow-up depth', value: 'deep on the 1997 night', note: 'you went past the surface answer' },
    { label: 'Open vs closed', value: 'doors, not dead-ends', note: 'your questions invited stories, not yes/no answers' },
    { label: 'Did Diane light up?', value: 'yes', note: 'she shared the hydraulic story, which she rarely tells' },
  ],
  feedback:
    "Diane has a quiet way of testing whether someone is actually listening. she does it by mentioning something specific and waiting to see if you follow up. you did. that's the whole skill: noticing the door she opened, and walking through it instead of changing the room. the hardest version of this is not getting it right on the first try, it's not pulling the conversation back to yourself when she trusts you with something. you held the line.",
};
