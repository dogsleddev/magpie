# Magpie · Product Spec

> **Magpie is now 2.0 (glint-first).** Canonical product model: [MAGPIE_2.md](MAGPIE_2.md). Build plan: [SOP.md](SOP.md). This doc predates the pivot; where it describes the daily habit, navigation, modes, or roadmap, MAGPIE_2.md wins. The three dimensions (Subject, Topic, Facet), the mode content and prompts, mic-to-text, empty states, and responsive rules here are still valid.

## Purpose

A personal conversation gym. You customize a grid of topics you actually care about. Magpie gives you a fresh angle on any of them in seconds. You riff for 3 to 5 minutes and capture what you said. Over time the grid grows, your notes compound, and topics you didn't know existed find their way in.

**Audience:** People who love to talk and think out loud. Curious generalists. Podcast hosts in training. Founders practicing pitches. Anyone who walks into a dinner party wanting two good things to say about something interesting.

**Promise:** Less staring at a blinking cursor. More actual riffing.

---

## Three dimensions

Magpie organizes content along three orthogonal dimensions. The user can browse along any of them.

### 1. Subject (parent category)
Examples: History, Music, AI & Tech, Wildlife, Astronomy & Physics.
Each user has a personal list of subjects. Subjects are containers.

### 2. Topic (the entity)
Examples: "Why every empire thinks it is the last one," "Snow leopards: the cat that never roars."
Topics live inside subjects. Each topic has a title, a parent subject, zero or more facets, and a thoughts array.
The topic IS what the user riffs on.

### 3. Facet (cross-cutting tag)
Examples: paradox, fun facts, future, evolution, philosophy, history, discoveries, thought experiment.
Facets cross subjects. A "fun facts" facet can pull a topic from Wildlife AND from Astronomy AND from Food.
One topic can have multiple facets. Most topics have 1 to 3.

**Why this matters:** Subjects give you "I want to talk about music" navigation. Facets give you "I want a paradox" navigation. Same data, different lenses.

---

## Navigation

### Bottom tab bar (4 tabs)

> **Stale nav.** The four tabs below (Grid / Facets / Discover / Journal) predate the build. Live today the bar is **Grid / Facets / Nest / Rediscover** (the Nest constellation replaced the Journal tab). In 2.0 it becomes **Grid / Facets / Nest / Library** (Library replaces Rediscover), with a gated personal **Home** dashboard behind the wordmark. See MAGPIE_2.md C.2.

1. **Grid**: Home view, browse by Subject
2. **Facets**: Browse by Facet (cross-subject lens)
3. **Discover**: AI-suggested topics queue
4. **Journal**: Captured thoughts across topics

(Earlier iterations had "Topics" as a flat-list tab. Now the flat list lives inside Subjects view as a "All" option, and Facets gets the dedicated tab.)

### Home (Grid view)

Top: Two-button row.
- **Add topic** (secondary outline): opens Add Topic modal
- **Convo Roulette** (primary filled): spins to a random topic

Below: List of subjects with topic counts. Tap a subject to drill in.

### Subject drill-down

Top: Subject name in app bar.
Below: Horizontal scrolling row of **facet chips** showing all facets used across topics in this subject. An "All" chip resets the filter.
Below: List of topic cards filtered by the active chip.

### Facets view (NEW)

Top: "Facets" in app bar.
Below: Grid or list of all facets with topic counts ("paradox · 7", "fun facts · 12").
Tap a facet to drill in.

### Facet drill-down (NEW)

Top: Facet name in app bar (e.g. "Paradox").
Below: List of every topic across all subjects with this facet. Each topic card shows its parent subject as a pill.

### Topic detail

Top: Back button + "Topic" title in app bar.
Below: 
- Meta pills (subject + facets)
- Topic title (Fraunces serif, prominent)
- **Mode tabs:** `{persona}` · `Brief` · `Challenge` · `Questions` · `Convo`
- Active mode content
- Organize result (if AI-organize was run)
- Related section (AI-suggested adjacent topics)
- Save & spin again button

The default active mode on topic open is `{persona}` (the bullet capture, named after the persona).

---

## The five modes

> **2.0 restructures the tabs.** The mode content and prompts below still hold, but the tab set and default change: 2.0 tabs are **Brief (default) · Challenge · Questions · Maggie**, where the far-right Maggie surface merges today's chat (Convo) and bullet capture (persona/Thoughts). This is deferred until after the glint loop is proven, so the live app still opens on the persona tab for now. See MAGPIE_2.md C.3.

### Mode 1: `{persona}` (default: "Maggie")

The bullet capture mode. Named after the persona so it feels like a collaborator rather than a feature.

Layout:
- Small timer pill in the top-left of the card (▶ 0:00, tap to start/pause, reset spins out when elapsed > 0). Timer is OPT-IN, not the hero.
- Thought count in the top-right ("3 thoughts")
- Input field with placeholder **"What's on your mind?"** + Add button
- Mic-to-text button on the input
- List of captured thoughts as bullets below
- Each bullet is tappable to edit inline, with a hover X to delete
- When thought count >= 3, an **Organize with AI** button appears at the bottom of the card

Interaction:
- Type a thought, hit Enter or tap Add. Bullet appears in the list.
- Tap a bullet to edit it inline. Enter or blur to save. Escape to cancel.
- Hover (desktop) or tap (mobile) a bullet to reveal the X. Tap X to delete.
- Tap mic to start dictation. Mic pulses. Transcript fills the input. Tap mic again to stop.
- Tap Organize to send all bullets to Sonnet, which structures them into:
 - **Insights** (key takeaways)
 - **Counter-arguments** (objections you should consider)
 - **Follow-ups** (questions worth chewing on)
 - **Learn more** (topics to explore: these auto-feed the Discover queue if AI suggestions is on)

The organize result lives outside the card, persists across thought additions, and clears on mode switch.

### Mode 2: Brief

Sonnet-generated 3 to 5 talking points to prepare the user for a 3-to-5-minute riff. One tight sentence per point with a concrete hook.

UI: A single card with a "Sonnet · Briefing" label, the numbered list, a Reroll button. Cached in `ai_cache` so revisits are instant.

### Mode 3: Challenge

Sonnet generates ONE compelling challenge per call, picked from: steelman of an unpopular view, hot take, or paradox. Punchy, 3 to 5 sentences. Leads with the type tag in italics (e.g. "*Paradox.*" then the challenge).

UI: Single card with "Sonnet · Challenge" label, the take, a Reroll button. Cached.

### Mode 4: Questions

Haiku-generated 3 to 4 open, generative questions about the topic. Not trivia, not yes/no. These are the questions that hand the floor to someone else and make them want to talk. The charisma lens: walk into a conversation armed with great questions, not just opinions.

Example for "Why every empire thinks it is the last one": "What's an institution today that you think is quietly building its own replacement?"

UI: Single card with a "Questions" label, the list, a Reroll button. Cached in `ai_cache` under mode `questions`.

This is the MVP slice of the broader charisma layer. See `docs/CHARISMA.md` for the full thesis and the flagship Draw Out mode that comes later.

### Mode 5: Convo

A full chat with the persona about this topic. Persona speaks in lowercase, casual, brief (1 to 3 sentences usually), never starts with "Great question!" or generic AI openers. Shares their own takes, not just questions back. Occasionally suggests adjacent topics.

UI: Full-screen chat view. Topic title in header. Messages. Input field at the bottom with mic button. Streams responses.

Saved per topic in the `conversations` table.

---

## User flows

### First-time user

1. Land on `magpie.wiki`
2. See a brand-forward landing (Magpie wordmark, tagline, "Get started" CTA)
3. Click Get Started → Supabase magic link auth
4. After auth, see an onboarding screen: "What are you into?" with a single textarea
5. User types interests in natural language. Mic button available.
6. Submit → AI extracts subjects and topics from the text (using the Extract prompt)
7. User confirms with checkboxes which to keep
8. Grid is seeded. User lands on home with their personal subjects.

Optional: skip onboarding and seed with the starter pack from `lib/seed/starter-topics.ts`.

### Returning user, daily riff

> **In 2.0 the daily habit is the glint, not a Convo-Roulette spin.** The returning-user loop is: catch a glint (a 1-to-3-word curiosity in about 30 seconds), tap one of Maggie's 2-to-3 connection chips, and that catch keeps the streak. The random spin survives as a "surprise me" action inside the Library, not the daily hook. See MAGPIE_2.md C.5 and C.6.

1. Open app on phone
2. See home grid
3. Tap **Convo Roulette** to get a random topic
4. Land on topic detail in `{persona}` mode
5. Optionally: read Brief or Challenge for a hook
6. Tap mic, talk out loud for 3 to 5 minutes, capturing thoughts as bullets along the way (or after)
7. Tap Organize when done
8. See structured output
9. Tap Save & spin again

### Adding a new topic

**AI assist path (default):**
1. Tap Add topic on home
2. Tap "AI assist" tab in modal
3. Type a sentence about an interest, with mic if you want
4. Tap Extract → AI generates subjects and topics
5. Uncheck any you don't want
6. Tap Add → topics added to grid

**Manual path:**
1. Tap Add topic on home
2. Tap "Manual" tab in modal
3. Type a topic title
4. Pick or create a subject
5. Pick facets from a chip row
6. Tap Add

### Discovering adjacent topics

1. In any topic detail, the **If this hits, you'd dig** section shows AI-suggested related topics
2. Tap + to add one to the grid (it joins the same subject as the parent topic)
3. Or, navigate to Discover tab to see a queue of suggestions accumulated from Organize runs and explicit "ask Magpie for ideas" prompts
4. Skip or Add each one

### Renaming the persona

1. Open Settings
2. Tap persona name field
3. Type new name (e.g. "Birdie") with mic if you want
4. Save
5. Every mode tab label, placeholder, and copy reference updates immediately. Settings header now shows "Birdie." Convo mode is now a chat with Birdie. The first mode tab is now "Birdie."

### Toggling AI suggestions off

1. Open Settings or use the inline toggle in any topic
2. Toggle OFF
3. All proactive AI surfaces hide: related topics section, Discover tab shows "AI suggestions are off," organize doesn't auto-feed Discover
4. Invoked AI (tapping Brief, Challenge, Convo, Organize) still works. The toggle controls PROACTIVE suggestions, not user-invoked AI.

---

## Mic-to-text

Available on every text input in the app:
- Home: not applicable (no text input)
- Add topic AI-assist input
- Add topic manual title
- `{persona}` mode thought input
- Inline thought edit
- Convo mode chat input
- Settings persona name input

Pattern: mic button sits inside the input, right-aligned, before any send/add button. Pulses when recording. Disabled with tooltip if browser doesn't support Web Speech API.

Reusable hook: `useSpeechToText()` returns `{ isListening, transcript, start, stop, supported }`.

---

## Empty states

- **Home with no subjects:** "Empty grid · Tap Add topic to start collecting"
- **Subject with no topics:** "No topics yet · Add one or spin random"
- **Subject filtered by facet with no matches:** "No topics with that facet yet"
- **Facet view with no facets:** "Build a few topics first · Facets emerge as you tag"
- **Facet drill-down with no topics:** Shouldn't happen (facets are only listed if they have topics)
- **Topic in `{persona}` mode with no thoughts:** "Catch thoughts as they come, edit later"
- **Convo mode with no messages:** Maggie opens with "hey, what's pulling you on this one?"
- **Discover with empty queue:** "Nothing waiting · Tap below to ask Magpie for ideas"
- **Journal with no thoughts:** "No notes yet · Riff on a topic, capture thoughts as they come"

---

## Settings

- **Persona name** (default "Maggie"): text input + mic
- **AI suggestions toggle**: on by default; controls Discover surface visibility and AI-assist Add Topic
- **Glints toggle**: on by default; controls inline-in-Convo Glints surfacing only. The home grid Glints section and topic-page Glints card remain accessible regardless. See `docs/FUTURE_FEATURES.md` for the full Glints spec. **(2.0 rename: the word "glint" now means the daily 30-second capture and streak unit. This inward-surfacing feature is renamed the "resurfacing engine" and moves into the Library. 2.0 Settings also gain a daily-trigger channel, font choice with a dyslexia-friendly option, and a System/Light/Dark theme. See MAGPIE_2.md C.9 and C.12.)**
- **Default landing mode**: which tab is active when opening a topic. Default is the persona-named tab.
- **Reset to seed**: destructive, requires confirm
- **Account**: email, sign out, delete account
- **About**: Magpie · v1 · Collect curiosities. Talk them through.

---

## Cross-context and conversation pacing

How Maggie's awareness of the wider wiki grows over time, and how she handles that awareness in conversation, lives in `docs/MEMORY.md`. The four-level cross-context model (within-topic, within-group, cross-topic via facets, cross-topic via embeddings, persistent Maggie memory) and the conversation pacing rules are both speced there. Read it before building Phase 5.5 or any later phase that touches Convo.

---

## Responsive layout

Magpie is mobile-first by design. Desktop is a real surface that earns one extra layer of context, not a stretched mobile layout. Full layout spec in `docs/RESPONSIVE.md`. Key rules:

- Mobile under 768px is the design source of truth (single column, bottom tab bar)
- Tablet 768-1280px is a graceful transition
- Desktop 1280px+ replaces the bottom tab bar with a left rail and may use two-pane layouts where they earn the second pane
- Reading-width discipline (`max-width: 720px`) for text-heavy modes
- The brand voice survives the format change

---

## Out of scope for v1 launch

- Topic groups (Option 2 architecture): **now LIVE.** `is_group` and `parent_topic_id` are active with a drilldown UI (Red Rising, Corvids), no longer dormant. In 2.0 the placement step runs on every glint catch.
- Glints (the surfacing surface): **now the "resurfacing engine"** (renamed in 2.0, since "glint" is the daily capture); lives in the Library.
- Nest View (constellation graph): **now LIVE** at the `/nest` tab (it replaced the Journal tab). 2.0 adds a 2D/3D toggle over the same `build-graph.ts`.
- Topic sharing (send a topic to a friend)
- Multi-device sync conflict resolution (Supabase handles last-write-wins by default; fine for now)
- Public profile / discoverable curators
- Export to Markdown / Notion
- Voice-only mode (Maggie speaks back; opens an audio session)
- Mobile app (PWA only in v1; native via Expo or similar in v2)
