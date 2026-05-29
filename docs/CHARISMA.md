# Magpie · Charisma Layer

This document specs the conversational-charisma features. It is the why and the how behind two additions: **Questions mode** (ships in MVP) and **Draw Out mode** (flagship, post-MVP).

---

## The thesis

Magpie's original skill is **output**: have interesting things to say, riff solo, drop a good take. The win condition is "be the most interesting person in the room."

The charisma layer trains the opposite and arguably more valuable skill: **draw-out**. The host. The interviewer. The person who barely talks but makes everyone leave thinking "that was the best conversation I've had in months." The win condition is "make everyone else sound like the most interesting person in the room."

This is not about being passive or self-erasing. It is about a specific, learnable form of charisma: the generosity of attention. The person who asks the next question, builds on your point, and makes you feel heard. Research on likability backs this directly: people who ask more follow-up questions are rated as significantly more likable, because a follow-up is proof you listened and want more.

Chris's framing, verbatim: "Not someone to take over a conversation, but someone who brings out the best in everyone else's thoughts so they sound heard."

---

## The frameworks it teaches

These are the actual conversational mechanics the AI coaches against. They are the rubric.

### 1. Support response vs shift response
From sociologist Charles Derber's work on conversational narcissism. When someone shares something, you can either support (keep the attention on them) or shift (move it to you).

- Shift: "I just got back from Japan." → "Oh I loved Japan, when I went..."
- Support: "I just got back from Japan." → "What surprised you most?"

Most people shift constantly without noticing. Awareness of your shift/support ratio is the single highest-leverage change.

### 2. Open vs closed questions
Closed questions get a one-word answer and kill momentum. Open questions invite a story.

- Closed: "Did you like it?"
- Open: "What pulled you toward it?"

### 3. Yes-and (from improv)
Build on what they said, give them credit, never block. Accept their premise and add to it rather than redirecting or correcting.

### 4. Reflective listening (natural, not robotic)
Mirror back the heart of what they said so they feel understood. Not therapy-speak ("I hear that you feel..."), but natural ("so the part that's really getting to you is the timing").

### 5. Status-raising
The charisma of generosity. Make the other person look good on purpose. Tee them up to share the thing they are great at. Credit their ideas in front of others.

---

## Feature 1: Questions mode (MVP)

**What it is:** A fifth content lens on every topic, alongside Brief and Challenge. Instead of "here are 3 things to say," it is "here are the 3 questions about this topic that would make someone light up."

**Why it ships in MVP:** It is cheap. It is one more prompt against the existing per-topic structure. It immediately makes the user a better question-asker with zero new UI surface beyond a tab.

**Model:** Haiku (lightweight, same tier as Brief).

**Output:** 3 to 4 open, generative questions. Each one is the kind of question that hands the floor to someone else and makes them want to talk. Not trivia questions, not yes/no questions. Questions that open a door.

**Example for the topic "Why every empire thinks it is the last one":**
- "What's an institution today that you think is quietly building its own replacement?"
- "When you look at something that feels permanent, what tips you off that it's actually fragile?"
- "Is there a moment in your own field where you watched the old guard not see it coming?"

**UI:** Add "Questions" as a mode tab. Cached per topic like Brief and Challenge. Reroll button. Tab order becomes: `{persona}` · Brief · Challenge · Questions · Convo.

**Caching:** Add `'questions'` to the `ai_cache.mode` check constraint.

---

## Feature 2: Draw Out mode (flagship, post-MVP)

**What it is:** A practice mode where the user's job is to make the AI shine. Maggie (or a dedicated character) role-plays someone with something interesting buried inside them: a guarded expert, a shy genius, someone sitting on a great story they will not volunteer. The user asks questions to draw it out. The app scores conversational generosity.

**Why it is the flagship:** Nobody else has this. A conversation app that trains you to make OTHER people brilliant is a genuine category of one. It is the most demo-able, most differentiated, most "thought leader" feature in the whole product. It is the flag Chris plants.

**The inversion:** Convo mode = Maggie makes YOU sound smart. Draw Out mode = YOU make a character sound smart. Same streaming chat tech, inverted goal and scoring.

### How a session works

1. User picks a topic (or gets a random one).
2. The app generates a **character** with a hidden gem: a backstory, an area of buried expertise, a story they are reluctant to tell, or a strong opinion they are holding back. The character is briefed (in the system prompt) to NOT volunteer the good stuff. They open up only in proportion to how well the user draws them out.
3. The user converses. Their goal: get the character to share the interesting thing, feel heard, and light up.
4. The character's responses get richer and more open as the user asks good questions, and stay flat/guarded if the user shifts, interrogates, or makes it about themselves.
5. After the session (or on demand), Maggie steps out of character and scores the user.

### The character generator

A Sonnet call that, given a topic, produces a character with:
- A name and a one-line persona ("Diane, a retired air traffic controller who never talks about the near-miss that changed aviation safety")
- A hidden gem (the thing worth drawing out)
- A reluctance style (shy, guarded, modest, distracted, terse)
- An open-up condition (what kinds of questions unlock them)

This briefing lives in the system prompt for the role-play. The character is instructed to stay in character, reveal gradually, and reward genuine curiosity.

### The scoring rubric

After the session, score the user on conversational generosity. Output is a small, honest report card, not a vanity metric. Dimensions:

- **Question-to-statement ratio.** How much did you invite vs declare?
- **Support vs shift.** How often did you keep the floor with them vs take it?
- **Follow-up depth.** Did you go deeper on their answers, or hop to new subjects?
- **Open vs closed.** Were your questions doors or dead-ends?
- **Did they light up?** Did the character actually reach and share the hidden gem? (The ultimate outcome metric.)

Tone of the feedback: a sharp, encouraging coach. Specific, not generic. "You asked 6 questions and made 2 statements, great ratio. But you shifted twice when Diane mentioned the storm. Next time, sit in her moment: 'what was going through your head right then?'"

**Model:** Sonnet for both the role-play and the scoring (needs taste and character consistency).

### UI

- Entry point: a "Draw Out" action, either as a mode tab on a topic or a dedicated tab. Decide during build; leaning toward a dedicated entry since it is a distinct activity from solo riffing.
- Chat UI reuses Convo's streaming components.
- A subtle "warmth meter" can show how open the character currently is (optional, could be cheesy, prototype and feel it out).
- End session → score report card slides up.

### Schema

Draw Out sessions can reuse the `conversations` table with a `kind` column to distinguish from regular Convo, or get their own table if the scoring data justifies it:

```sql
alter table conversations add column kind text not null default 'convo' check (kind in ('convo', 'drawout'));
-- and optionally a scores table
create table drawout_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  conversation_id uuid references conversations(id) on delete cascade not null,
  question_ratio numeric,
  support_shift numeric,
  followup_depth numeric,
  lit_up boolean,
  feedback text,
  created_at timestamptz default now()
);
```

---

## How this maps to the brand

The metaphor cooperates. A group of magpies is called a **parliament** (also a tiding, a charm, or a gulp). Magpies are also accomplished **mimics**, learning and echoing other birds' calls. A bird whose gift is bringing other voices into the room. If the charisma layer ever grows into a full named track or social surface, **"The Parliament"** is the working name. Not needed for the two features above, but parked here because it is too good to lose.

---

---

## Vision tier: Draw Out v2 (read the room)

NOT FOR THE BUILD YET. This is captured so the thread is not lost. It is where Draw Out grows once v1 proves people want to practice this at all. Do not let it delay v1 or anything that ships.

**The insight:** Draw Out v1 trains the *response*: a known character, a clear setup, and you practice the technique of drawing them out. The deeper skill, the one that actually runs in a real conversationalist's head, is the *read*: the same move (interjecting, sharing your own take, shifting) is generous in one situation and theft in another, and the hard part is knowing which situation you are in before you act.

**Three variables that move independently:**
- The **person** (guarded expert, over-sharer, nervous junior, chronic shifter)
- The **room** (loud group dinner, tense 1:1, networking float, board meeting)
- Your **status in that room** (host, new guy, most senior, outsider)

The same behavior changes value across every combination. A shift at a loud friendly table is just the format. The same shift three sentences into something that matters to someone one-on-one is real theft, and they feel it even if they cannot name it. High-status people can shift all day and it reads as leadership; the same move from a lower-status person reads as interrupting. The skill is the read plus the adjustment, not any fixed technique.

**Why it is v2, not v1:** v1 trains the response against ONE clear character with a visible setup. v2 turns a single variable on: the stakes go HIDDEN. The app drops you into a scene with limited info, the way real life does. You are not told "this is a tense 1:1." You infer it from how the character behaves, then calibrate. Scoring shifts from "did you ask good questions" to "did you correctly read the stakes and adjust." Misread a warm casual table as high-stakes and play it stiff: you lose. Misread a real moment as casual and shift over it: you stepped on something.

**Same architecture, one knob:** v2 reuses the v1 engine (character generator, role-play system prompt, scoring). The additions are a hidden "true stakes" value the character holds and reacts from, character behavior that must believably react when the user misjudges the room, and a scoring rubric that evaluates calibration rather than counting questions. Earn the way there by shipping v1 first.

---

## Build sequencing

- **Questions mode:** folds into MVP Phase 5 (AI modes). It is just another prompt and tab. Trivial add.
- **Draw Out mode:** new phase, slots around Phase 11 (after the desktop and demo work, alongside or just before the social layer). It is a flagship feature and deserves its own focused build, not a rushed bolt-on.

---

## Open questions for later

- Is Draw Out a mode on a topic, or its own top-level activity with its own topic-free character library?
- Should there be a streak/progression for conversational generosity (get your shift-ratio down over 30 sessions)?
- Could real transcripts (from the user's actual recorded conversations, with consent) be scored against this rubric someday? That is the killer pro feature, but it is a privacy and scope mountain. Park it.
- Should characters be reusable and recurring, so you build a relationship with "Diane" over many sessions and she opens up more over time?
- For v2 (read the room): how do you score calibration fairly when the "right" read is itself debatable? Maybe the character's reaction IS the score, no separate rubric needed.
