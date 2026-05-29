# Magpie · Future Features Notes

Notes captured for when you pick this back up on the other computer. Stuff that goes beyond the 9-phase build plan in `BUILD_PLAN.md`. Treat this as a parking lot, not a commitment.

---

## 1. Auth and new user system

**Current plan (in bootstrap):** Supabase magic link only.

**What you want to add:**
- Email + password auth (in addition to or instead of magic link)
- Profile creation on signup:
 - Handle (e.g. `chris`) → used in public URLs: `magpie.wiki/u/chris`
 - Display name
 - Avatar upload
 - Short bio (160 chars, Twitter-style)
 - Maybe: top 3 favorite topics pinned to profile
- Customization: theme variants? Custom accent color from a small palette? (Save for later, but the plumage palette has 3 accents already, so let users pick which one is their "primary")

**Schema additions needed:**
```sql
alter table user_settings add column handle text unique;
alter table user_settings add column display_name text;
alter table user_settings add column avatar_url text;
alter table user_settings add column bio text;
alter table user_settings add column primary_accent text default 'teal' check (primary_accent in ('teal', 'blue', 'purple'));
alter table user_settings add column profile_public boolean default false;
```

The `profile_public` flag is key for the social and demo work below.

---

## 2. Onboarding (Substack-style interest selection)

**Goal:** New users get a personalized starter wiki in under 60 seconds.

**Flow:**
1. After signup, land on "What are you into?" screen
2. Show a grid of ~24 interest chips: History, AI, Music, Wildlife, Astronomy, Philosophy, Sports, Food, Movies, Books, Tech, Science, Politics, Psychology, Travel, Design, Architecture, Games, Comics, Business, Crypto, Health, Climate, Languages
3. User taps to select 3 or more
4. Optional second step: free-text "tell me more about what's pulling you right now" with mic (uses the Extract prompt already in `lib/ai/prompts.ts`)
5. Submit → AI generates subjects and topics based on selections + free text
6. User confirms with checkboxes
7. Grid is seeded, user lands on home

**Implementation note:** The current `lib/seed/starter-topics.ts` is a fallback. Build a `lib/seed/interest-packs.ts` keyed by interest chip, so picking "Wildlife" + "Astronomy" pulls those packs and merges them. AI fills the gaps based on free text.

**Skip path:** "Start with Chris's curated pack" → uses the existing starter pack from `lib/seed/starter-topics.ts`.

---

## 3. Demo mode (no-auth browse)

**Goal:** Someone clicks the magpie.wiki link from dogsled.dev portfolio, sees a working Magpie immediately, no signup required.

**Implementation:**
- Default unauthenticated landing on `magpie.wiki` shows YOUR public wiki (Chris's, by handle)
- All four modes work but read-only:
 - Bullet capture: input disabled with "sign up to riff"
 - Brief and Challenge: visible (cached)
 - Convo: visible past convos read-only, no new messages
- Persistent CTA: "Make your own wiki" → signup
- Tag: "You're viewing Chris's wiki. Make your own."

**Route structure:**
- `magpie.wiki/` → if logged in, your wiki. If not, redirect to `/u/chris` (your demo wiki)
- `magpie.wiki/u/[handle]` → public profile view of any user with `profile_public = true`
- `magpie.wiki/login` → auth
- `magpie.wiki/signup` → auth + onboarding

**Anonymous read endpoint:** The query functions in `lib/queries/*` need a variant that takes a `userId` argument (instead of always pulling `auth.uid()`) for the public profile case. Maybe `getPublicSubjects(handle: string)` etc, which only return rows where the owner has `profile_public = true`.

---

## 4. Browser / desktop mode

**Current plan:** Mobile-first, with desktop as "centered phone frame" styling.

**What you want:** A real desktop UX since portfolio traffic comes through a browser.

**Two paths, pick one:**

### Path A: Responsive scale-up (recommended)
- Mobile (under 768px): current single-column with bottom tab bar
- Tablet (768 to 1280): two-column split. Left rail with subjects, right column with topic detail.
- Desktop (1280+): three-column. Far left nav rail (icons), middle column for subject/topic list, right column for active topic detail. Bottom tab bar is hidden; nav moves to the rail.

### Path B: Phone frame + studio toggle
- Default desktop is the centered phone frame (brand statement)
- A "studio mode" toggle in settings opens a real 3-column layout for power use

**Recommendation:** Path A. Cleaner, more accessible, and your portfolio visitors won't appreciate having to figure out a toggle. Make the desktop layout feel intentional and editorial, like an Are.na board or a Linear project.

**Note:** This is a meaningful redesign. Probably add as a Phase 10 in the build plan: "Responsive desktop layout."

---

## 5. Profile customization

Already covered in section 1 (schema), but the UI:
- Settings page gets a "Profile" tab
- Edit avatar (upload to Supabase Storage in a `avatars` bucket)
- Edit handle (with availability check)
- Edit display name and bio
- Pick primary accent (teal, blue, or purple): the UI updates throughout
- Toggle "Make my profile public"
- Preview button: "See what others see"

---

## 6. Social: wiki overlap and sharing

This is the killer feature. Magpie becomes interesting when wikis can talk to each other.

### Level 1: Follow
- On any public wiki, a "follow" button
- Your `discover` tab gets a new section: "From wikis you follow"
- AI can surface "@nina just added a topic to her History subject you might dig"

### Level 2: Remix
- On any topic in any public wiki, a "remix into mine" button
- Clones the topic into your wiki, lands in a "Remixed" subject (or you pick)
- Original attribution shown as a small pill: "remixed from @nina"
- Remixed topics still have their own thoughts/Brief/Challenge/Convo (independent)

### Level 3: Overlap view
- A view that shows: "you and @nina both have these 5 topics"
- Diff view: "topics @nina has that you don't"
- Suggestion engine: "the most-overlap user with you is @marco, here's what he's into that you might want"

### Level 4: Co-riff
- Invite a friend to riff on the same topic together
- Convo mode becomes a 3-way: you, @nina, and Maggie
- Maggie moderates, asks pointed questions, summarizes
- One conversation, two sets of bullet captures, one shared organize result

**Database for this:**
```sql
create table follows (
 follower_id uuid references auth.users(id) on delete cascade not null,
 followed_id uuid references auth.users(id) on delete cascade not null,
 created_at timestamptz default now(),
 primary key (follower_id, followed_id)
);

alter table topics add column remixed_from_topic_id uuid references topics(id);
alter table topics add column remixed_from_user_id uuid references auth.users(id);
```

---

## 7. Badass features I'd back

These are mine, ranked by impact-to-effort.

### 7a. Topic embeds (high impact, low effort)
Each public topic gets an embed URL like a tweet. Paste a Magpie topic card into your dogsled.dev portfolio, a Substack post, a Notion page. iframe, no script tags. Wraps the topic title, the Brief, and a "talk about this on Magpie" CTA. This is how Magpie spreads.

### 7b. Daily Magpie email (high impact, low effort)
Opt-in. Each morning at 7am local time, get an email: "today's curio: [random topic title]" with the Brief inline. Tap → land on the topic in your wiki, mic ready. Newsletter functionality is just a cron-triggered Server Action. Could use Resend for delivery.

### 7c. Walking mode / voice-only riff (high impact, medium effort)
A button on any topic: "walk with this." Locks the screen to a single big mic and the topic title. You start walking, you talk, the app continuously transcribes and chunks into thoughts. Tap "done" when you stop. All thoughts auto-saved. This unlocks Magpie as a real conversation gym, not a desk tool.

### 7d. Magpie memory (medium impact, low effort)
Maggie's Convo prompt currently has no cross-topic memory. Build a "user context summary" that gets prepended to her system prompt: "the user has been riffing a lot on empires and AI ethics recently. their typical takes: X, Y, Z." Generated weekly with a Sonnet call over recent thoughts. Maggie becomes spookily aware of who you are.

### 7e. Riff streaks and stats (low impact, low effort)
A small stats card on the home screen: "5-day streak. 23 thoughts captured this week. Your most-riffed subject: Wildlife." Light gamification, doesn't dominate the UX. Lives in Journal tab.

### 7f. Curated wiki themes / starter packs by archetype (medium impact, low effort)
On signup, offer "themed packs" instead of plain interest chips: "Polymath," "History Buff," "Tech Bro" (haha), "Music Nerd," "Curious Kid." Each is a hand-curated set of subjects and topics that compose a distinctive wiki vibe. Doubles as a marketing surface.

### 7g. Topic chains (medium impact, medium effort)
Mark a sequence of topics as a chain: "The fall of empires (a 5-topic riff series)." When you finish riffing on topic 1, the app suggests topic 2 in the chain. Curators can publish chains as a unit. This makes Magpie a learning tool, not just a riff tool.

### 7h. Spotify Wrapped-style year-end recap (low impact, low effort)
Every December, generate "Your Magpie year." Top subjects, most surprising topics, most-quoted bullet, etc. Designed to be share-worthy. Pure marketing, but the kind users do for you.

### 7i. Riff battles (low impact, high effort, but fun)
Two users, one topic, three minutes each. Maggie scores both on punch, originality, and clarity. Friendly competition. Probably v3 territory.

### 7j. Audio playback of Maggie's responses (low impact, medium effort)
Maggie speaks back in Convo mode using a voice API (ElevenLabs or browser TTS). True conversation gym.

### 7k. Magpie API (high impact, medium effort, v2)
Public API so power users can:
- Push topics from other tools (Readwise highlight → Magpie topic)
- Pull their wiki data out (Magpie → Notion, Obsidian)
- Build custom workflows

Aligns with your finance-engineer / API-first instincts.

---

## 8. Glints (inward surfacing)

Glints surfaces things from the user's own wiki that connect to what they are currently working on. This is the *inward* counterpart to Discover (which proposes new things to add). Different verbs, different copy patterns, different surfaces.

### The distinction from Discover (critical)

| | Discover | Glints |
|---|---|---|
| Direction | Outward | Inward |
| Job | propose new topics to ADD | surface existing topics to REVISIT |
| Action verb | Add / Skip | (tappable, opens topic) |
| Copy pattern | "Maggie thinks you'd dig..." | "you wrote about this when..." |
| Lives in | dedicated bottom tab | home section + topic page + inline-in-Convo |

Conflating these two surfaces weakens both. The distinction must hold in code, in copy, and in user mental model.

### Three surfaces

**Home grid card.** A section below the Subjects list on home. Fraunces header reading "Glints," italic subtitle "worth a look this week," 3 visible tappable rows with a why-line under each title, "see all" tail. Each row opens an existing topic. No Add/Skip buttons.

**Topic detail bottom card.** When viewing any topic, a small Glints card appears near the bottom (below the Related section, above Save & spin again) when relevant glints exist for that topic. Same visual treatment as the home surface.

**Inline in Convo.** Maggie can surface a single specific bridge mid-conversation when the pacing rules allow. Governed by the principles in `docs/MEMORY.md`. One bridge, not a tour. Only at natural pauses. User can disable this surface via a Settings toggle without losing the other two.

### Principles

- **Maggie's voice, never feed format.** A glint reads like a friend remembering something, not an algorithm grinding.
- **Pull, not push.** Glints lives where the user goes looking. Never as notifications or banners.
- **No monetization.** No ads, no affiliates, no kickbacks. Glints serves the user, full stop.
- **Decay and surprise.** A glint surfaced once and ignored does not return for a while. The 10th most-related thing is often more interesting than the 2nd.
- **Diversity over relevance.** Tune the system to occasionally surface things that pattern-match loosely rather than tightly.

### Settings toggle

Inline-in-Convo behavior gets a single setting:

> **Glints** (toggle, on by default): Lets Maggie weave related thoughts and findings into your conversations when the moment is right.

Toggling off does not hide the feature. The home and topic-page surfaces remain. The toggle only controls whether Maggie surfaces glints during a Convo unprompted.

### Build dependency

Glints depends on Level 3 cross-context (facet-overlap query) from `docs/MEMORY.md`. Ships as Phase 10. Sharpens at Level 4 (embeddings).

---

## 9. Nest View (the constellation)

The visual read of the same cross-context engine that powers Glints. A force-directed graph showing topics as nodes and the connections Maggie has drawn between them as lines.

A working visual reference exists at `docs/magpie-v1-reference.html`. Open in browser to see the target. The screenshot you've reviewed in conversation came from there.

### Where it lives

- **Desktop:** a full canvas at `/nest`, centerpiece feature. The Facets tab gains a Nest View entry alongside the list-style facet view.
- **Mobile:** a smaller embedded view inside the Facets tab. Tap to expand into a full-screen sheet. No fifth bottom tab.

### What it shows

- Subjects as larger central nodes
- Topics as smaller nodes attached to their subject
- Cross-subject connections (shared facets, embedding similarity, Maggie-noted bridges) as lines between nodes
- AI-suggested-but-not-yet-added topics with a dashed outline (per the v1 reference)
- Hover: title and meta tooltip
- Tap: open the topic
- Drag: rearrange (state not persisted, just for exploration)

### Performance

Cap nodes shown at once around 50-80. For larger wikis, filter (by facet, by recency, by subject) or zoom-cluster.

### Build dependency

Nest View depends on having real cross-topic connections to display, which means Level 3 or Level 4 cross-context must be live. Ships as Phase 11, after Glints.

---

## 10. Personalized Surfacing (cross-media, principles-first)

Once Glints and Nest View are mature, the same cross-context engine can surface things from *outside* the wiki that fit the pattern of what the user has been pulling on. Books to read, films to watch, articles to skim, technologies to look at, people to follow. Different sources, same mechanism.

This is the natural endgame of the architecture. It is on the roadmap, but it ships with strict principles or it does not ship at all.

### The principles, non-negotiable

- **In Maggie's voice, never feed format.** "Honestly with the dystopia thread you've been pulling on, The Power by Alderman might wreck you." Not "Top 5 Books You'll Love."
- **Pull, not push.** Lives in Discover when the user goes looking, never as notifications or banners.
- **No monetization.** No ads, no affiliate links, no sponsored placements, no kickbacks on book sales. Magpie's trust with users depends on this being uncompromisable.
- **Cross-media from day one.** Books, movies, TV, podcasts, articles, technologies, people to follow. Real conversation drifts across media.
- **Diversity over relevance.** The 10th most-similar thing is often more valuable than the 2nd.
- **Decay and surprise.** A thing surfaced once and dismissed does not come back for months. Surfacing should feel like a friend remembering, not an algorithm grinding.

### Architecture relationship

This is not a separate feature. It is what the cross-context engine can already do once Levels 3-5 are in place. The implementation is a single new source layer in the existing Glints query: alongside "find connected topics in the user's wiki," add "find connected works outside the wiki that match the user's pattern."

### Why it stays on the roadmap rather than buried in backlog

Without it, the embedding and memory infrastructure feels like investment for a payoff we did not name. With it, the whole architectural arc reads as one coherent product evolution: from journaling, to thinking partner, to curator. Naming the endgame justifies the foundation.

### Open question deferred

The exact moment this ships is not fixed. It depends on whether Glints (inward only) is enough to define Magpie's surfacing identity, or whether outward surfacing is needed to fully realize the "compounding curiosity" promise. Decide when there is real user data.

---

## Priority recommendation

Most efficient sequence to ship after the 10-hour prototype + hackathon:

1. **Phase 5.5:** Topic Groups + Level 2 cross-context (the architectural unlock for Maggie's memory)
2. **Phase 6:** Facets navigation (real, not seeded)
3. **Phase 7:** Discover + Add Topic (replace bakes with real AI)
4. **Phase 8:** Settings + Polish (full)
5. **Phase 9:** Deploy with real domain
6. **Phase 9.5:** Desktop responsive (left rail, two-pane layouts, reading widths)
7. **Phase 10:** Glints
8. **Phase 11:** Nest View
9. **Phase 12:** Draw Out (the flagship charisma feature)
10. Then onboarding, demo mode, social layer, and the broader future-features set above

Do not try to do all of this. Pick the 3 phases post-launch that unlock the most. Working picks: Phase 5.5 (groups), Phase 9.5 (desktop), Phase 10 (Glints). Those three turn Magpie from a working prototype into a real product story.

---

## Open questions for next session

- Do you want a free tier with limits and a pro tier (a la Substack), or is this fully free?
- How private is private? Default off and opt-in to public, or default on with a private toggle?
- Are remixed topics attributed forever, or only the first time?
- Should Maggie's persona be customizable per user beyond just the name? (e.g. different system prompts: "the brutal version of Maggie," "the encouraging version")
- Should the wiki overlap engine be real-time or opt-in batch?
- When does Personalized Surfacing (outward, cross-media) ship? Tied to real user signal on whether Glints alone is enough.
