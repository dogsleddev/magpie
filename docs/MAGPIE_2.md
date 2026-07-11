# Magpie 2.0 · Canonical Product Model

**Owner:** Chris Dougherty (dogsled.dev) · **Created:** 2026-07-10 · **Updated:** 2026-07-10 (batch 3: glint-first, the daily habit is the glint, public view, communities, accessibility) · **Status:** the spec for the pivot

Single source of truth for the Magpie 2.0 pivot. The PRD (`docs/BRD.md`), the build plan (`docs/SOP.md`), and the session entry point (`HANDOFF.md`) draw from this doc. When they disagree with this file, this file wins on the product model; the live code wins on current state.

This version reflects a hard adversarial critique of the earlier plan (five-lens pass, 2026-07-10) plus Chris's decisions. The critique's core finding: the earlier plan built a spaced-repetition Daily Review as the daily habit, which is empty for new users, has no trigger, and stapled two habits to one screen. **The daily habit is now the glint, not the review.**

Grounding facts that carry through every section:

1. **RLS is not dormant.** Owner-only `auth.uid() = user_id` policies are live on every table. The pivot activates per-user authentication, and adds a deliberate **public-read** path for showcase content (C.10). It does not "turn on RLS."
2. **The topic tab restructure is a reorder plus a merge.** Today `ConvoMode` (the chat) is the leftmost default tab and `PersonaMode` (the bullet capture) is rightmost. The component names are misleading legacy.
3. **Per-item controls cannot ride `ai_cache`** (one opaque blob per mode). They need a `response_items` table with stable IDs and a generation marker. Load-bearing; sequence it when items are needed, not in Slice-0.

---

## Terminology (settled)

Three words, three layers, one record.

| Word | Where it lives | Meaning |
|---|---|---|
| **Glint** | The daily verb and the streak unit | The act of catching a small shiny thing (a thought, a noticing, a curiosity). "Catch a glint." A glint IS a curiosity at the moment you catch it. |
| **Curiosity** | User-facing: homepage, in-app collection | What a caught glint becomes. The thing you collect. The hero line stays "Collect curiosities. Talk them through." |
| **Topic** | Internal, code, feature docs | The database entity (`topics` table). Same record as a curiosity/glint. No code-wide rename. |

So "glint," "curiosity," and "topic" are the same record seen at three altitudes: the catch, the collection, the code. Do not rename the `topics` table or the code. Do use "catch a glint" as the capture language and "curiosity" as the collection language.

---

## A. Vision delta

**Hero, unchanged:** Collect curiosities. Talk them through.

**The daily loop, in Chris's three verbs:** catch a glint, watch it connect, keep the streak. You catch a small shiny thing in about 30 seconds, Maggie shows you how it connects to curiosities you already collect, and catching one glint keeps your streak. Over time the collection compounds into a body of thinking you can actually talk through.

**What changed from batch 2:** the daily habit is the **glint**, not a spaced-repetition Daily Review. The review was empty for new users (nothing saved yet), had no trigger, and competed with the glint for the same daily attention. The glint works on day one, is intrinsically rewarding, and is your stated vision. **There is no Daily Review surface at all.** The only thing "review" now describes is Maggie resurfacing your past glints in the Library, on your terms, never a daily gate (C.4, C.12).

**Proposed capture phrasing (not a locked tagline):** "Catch a glint." The one locked line stays the hero. Do not invent more taglines.

---

## B. Locked pivot decisions (from Chris)

Settled. Every doc treats these as given.

1. **The pivot is the focus.** LinkedIn launch and the prior UI-phase step aside.
2. **The glint is the daily habit and the streak.** Catching at least one glint per day keeps the streak (about 30 seconds: catch, and act on a connection). There is no Daily Review surface; the only daily thing is the glint. Resurfacing past glints lives in the Library (C.4).
3. **A glint is a curiosity is a topic:** one record. Catching a glint is adding a curiosity. No separate glints table; a glint is a topic caught through the daily flow, natively in the graph, so it connects for free.
4. **The trigger is an opt-in daily email or text.** A daily-habit product needs something that fires daily. Magpie has none today. Email or SMS (user choice) is the trigger; it becomes real once accounts exist (an address or number is required).
5. **Streak recovery: 7 days.** A missed day can be made up by entering a glint for it within 7 days. Beyond that, the streak resets.
6. **"Today" is the user's timezone, or PST if unavailable.** Capture the IANA timezone client-side; default `America/Los_Angeles`.
7. **Per-user accounts, but not first.** A public read-only view and the loop ship before auth (see decisions 12 and 13). Auth gates only the personal dashboard and private capture.
8. **Merge Thoughts plus Convo into the right-side Maggie.** Topic tabs: Brief (default), Challenge, Questions, Maggie. (Deferred until after the loop is proven; C.3.)
9. **A personal Home behind the wordmark is the gated dashboard** (your streak, your glints, your stats). It is NOT public.
10. **Facets become a controlled vocabulary.** Max 50 system-wide (the actual 50 curated later), and each user adopts up to 20 of them. Improves connection quality.
11. **Favorite starts binary; the 1-to-10 intensity is deferred.** Adaptive-temperature columns are captured early, the behavior flips on later.
12. **A totally public read view.** Anyone can browse everything (grid, curiosities, facets, Nest, the showcase) without signing up. They cannot see any personal dashboard. RLS gains a public-read path for showcase content.
13. **Two community models plus the public view** (C.10): shared-account communities (Gemini-style, dashboard and settings admin-gated), and individual-share nests. The current 168-topic account becomes the flagship public community nest (showcase and new-user density).
14. **Accessibility in Settings:** font choice (common web fonts plus a dyslexia-friendly option like OpenDyslexic), and a light-mode option (default stays dark, the magpie black).
15. **Voice is a priority right after the core structural work.** iOS Web Speech is a dead stub, so "figuring out voice" means server-side speech-to-text, not the browser API (C.9).
16. **Adopt all recut recommendations:** Slice-0 before auth, the cut list, `usage_events` analytics, the reroll generation marker, keyword/facet connections now with embeddings later, and the 168-account as the flagship community nest.

**Naming guards:** "Glint" is the capture and streak unit (not the resurfacing mechanic, which is renamed the resurfacing engine). "Home" is the gated personal dashboard behind the wordmark. Do not reuse either word for anything else.

---

## C. The full product model

### C.1 Catching a glint (adding a curiosity, creating a topic)

One flow does capture. Whether you tap the daily glint prompt or the "add a curiosity" button, you create a topic.

- **The record is a 1 to 3 word name.** "Wolves." "High Agency." "Empires." Scannable in the collection and legible as a Nest node label.
- **Parse on add, before any model call.** 3 words or fewer: the input is the name (`title = input`, `brief_seed = null`). More than 3 words: Maggie derives a 1-to-3-word `title` and writes `brief_seed` (the input rewritten into one clean opening sentence, faithful to intent); the raw input is kept on `topics.raw_input`.
- **Capture is optimistic, so it stays about 30 seconds.** The glint commits and the keyboard drops instantly (it feels done). Categorization (subject, facets, placement) and the connection chips (C.6) resolve a beat later, asynchronously. Capture must never block on a model call.
- **Placement resolver (extends `applyUmbrella`).** Most specific wins: explicit parent (from inside a group) > entity umbrella (same named entity) > subtopic of an existing topic (conservative `parent_topic`, respects `topicHasContent`) > top level in its subject. Depth stays two levels (Subject > Topic/Group > Subtopic). "When in doubt, null."
- **The daily streak derives from catches.** Catching at least one curiosity on a given local day covers that day (C.5). Any add counts, whether from the glint prompt or the add button.

### C.2 Information architecture and navigation

| Surface | Entry point | Public? | Holds |
|---|---|---|---|
| **Home** (personal dashboard) | Wordmark, `/home`, post-login landing | No, gated | Your glint capture, streak, activity calendar, stats. |
| **Grid** | Bottom nav | Yes (showcase content) | Browse by Subject. Short names, group rows. |
| **Facets** | Bottom nav | Yes | Cross-subject lens over the controlled vocabulary (C.8). |
| **Nest** | Bottom nav | Yes | The constellation. Short-name labels, a 2D/3D toggle (C.11). |
| **Library** | Bottom nav, lower-right (replaces Rediscover) | Own content only | Maggie as librarian: your curiosities, favorites, highlights, thoughts, conversations. |

- **Public read view (decision 12).** A logged-out visitor can browse the Grid, curiosities, Facets, and the Nest for showcase content (the flagship community nest, C.10). They cannot open Home, the Library of a private user, or any dashboard. Signup is only prompted when they try to catch their own glint or open their dashboard.
- **Bottom bar stays four tabs:** Grid, Facets, Nest, Library. Home lives behind the wordmark and is the post-login landing. In `bottom-tab-bar.tsx` the `rediscover` entry becomes `library`; the wordmark `href` and the auth redirect both target `/home` (for signed-in users).
- **The random spin relocates** into the Library as a "surprise me" action (`rediscover` stays). Note `spinRandomTopic` excludes groups today; widen it if the Library spin should reach subtopics.

### C.3 Topic interface (deferred until after the loop is proven)

Not in Slice-0. When built: tabs are **Brief (default) · Challenge · Questions · Maggie**. Maggie is the far-right merged surface (chat plus Jot capture plus highlight-driven conversation, absorbing today's `persona` and `thoughts` tabs). Migrate `user_settings.default_mode` default to `'brief'`, CHECK to `('brief','challenge','questions','maggie')`.

Item controls on Brief, Challenge, Questions: **Favorite (binary for now), Dismiss, Highlight** (favorite and dismiss mutually exclusive; highlight jumps to Maggie, stores a tagged thought, and is the unit shareable to a community nest). The 1-to-10 favorite intensity is deferred (decision 11). The full Maggie merge is a risky refactor of working code (C.3 is one of the cut items), so at most do the cheap tab reorder early and hold the merge.

### C.4 Library (Maggie as librarian)

A read model over your own tables (`lib/queries/library.ts`), owner-scoped. Collections: your curiosities (your caught glints), Favorites, Highlights, Thoughts (composed from `getAllThoughtsGrouped`; the old Journal view is gone, replaced by Nest, but the query survives), and Conversations. Maggie surfaces one card at a time, pull not push, following the one-bridge pacing in `docs/MEMORY.md`. **Maggie resurfacing your past glints here is the only thing the word "review" describes:** a pull-based, optional look back on your terms, never a daily gate and never on Home.

### C.5 The daily habit and streak

**The habit is the glint.** Catching at least one glint (curiosity) on a given local day covers that day. That is the entire daily action: about 30 seconds, catch and act on a connection. There is no card-review chore gating the streak.

- **Streak writer:** `captureGlint` (which is the topic-create path) marks today covered. A dedicated path, so the streak cannot be faked.
- **Derivation:** current and longest streak are derived from the contiguous run of covered local dates (cached on `user_settings` for cheap Home reads; the covered dates are the truth).
- **Recovery (decision 5):** a gap of 1 to 7 days is recoverable by entering a make-up glint credited to the missed date. Day 8 resets to 1. Kept at 7 on purpose: a fragile new habit needs forgiveness, and a broken streak with no way back is a stronger quit signal than a generous one. Tighten toward 3 later, once the habit is proven and the streak should feel more earned.
- **Timezone (decision 6):** every date is the user's local date from their stored IANA timezone, defaulting to `America/Los_Angeles` (PST) when unknown. Capture it client-side at signup with `Intl.DateTimeFormat().resolvedOptions().timeZone`. This must land before any date-based table exists.
- **The trigger (decision 4):** an opt-in daily email or text at a user-set time (default around 7am local) pulls the user back to catch their glint. Built with per-user accounts (an address or number is required). Vercel Cron plus a provider (Resend for email; a provider like Twilio for SMS, which costs per message). Keep the streak visually quiet (a small number, not a nagging flame), because a streak is loss aversion bolted onto a delightful act, and the connection moment, not the streak, should be the reward the user feels.
- **Activity calendar and stats (Home):** a binary GitHub-style grid of covered dates, mobile-first at 375px, plus stat tiles (streak, glints caught over time, top subject this month) as read models in `lib/queries/stats.ts`.

### C.6 Connections (the middle verb)

Making connections is the differentiated, Magpie-only step, and it fires at capture. **Validated by a spike against the real 171-topic graph (2026-07-11, `scripts/connection-spike.mjs`): the Haiku semantic match produces genuinely good, often delightful chips.** A "heron standing dead still" glint connected to Corvids, "Ravens hold funerals," and "Snow leopards: the cat that never roars" (shared stillness, exactly the magpie-brand magic); "seahawks defense looked different" found the Seattle Seahawks curiosity that keyword matching missed entirely. This is the loop's magic and it works.

- **The chips come from Haiku, not keyword matching.** One Haiku call takes the glint text plus the list of existing curiosity titles (and facets) and returns 2 to 3 genuine connections, each with a short reason. The spike proved **keyword/facet overlap is too brittle to power the chips:** it nails literal-word matches but returns misleading garbage otherwise ("smell of rain on hot pavement" keyword-matched "the hot hand" and "hot sauce"). Keyword is not a quality source; the chips wait for Haiku.
- **Capture stays fast because the glint commits first.** Capture is optimistic (C.1): the glint saves and the keyboard drops instantly (it feels done), a subtle "finding connections" state shows, and the Haiku chips animate in about a second or two later. Do NOT show keyword chips in the meantime; they would be wrong. The glint is already saved, so the chips are a bonus that lands a beat later, which the spike confirms is the right shape.
- **Tapping a chip** links the curiosities; a chip can also promote the glint into a fuller curiosity or file it under a parent.
- **Tune Haiku toward honesty.** In the spike it was eager, always returning three even for a tiny sensory glint, sometimes a stretch ("smell of rain" to "why every American downtown looks the same"). The production prompt should prefer 1 to 2 high-confidence chips and genuinely allow "this one is a fresh one, nothing connects yet," so the chips stay trustworthy.
- **Embeddings are a scale optimization, not a prerequisite (revised down from Phase 3).** The spike shows Haiku over the full title list is a strong engine at hundreds of topics, and it works for sparse new-user graphs too (fewer titles, still finds real matches or honestly declines). Add pgvector embeddings only when a user's graph outgrows what fits comfortably in one prompt (many hundreds to thousands of titles) or when cost or latency at scale demands it. For a thin new-user graph, optionally match against the public community graph (C.10) to enrich early connections. The controlled facet vocabulary (C.8) still helps, but the semantic lift is Haiku's.

### C.7 Adaptive Maggie temperature (columns now, behavior later)

Capture the signal from day one, flip the behavior later (decision 11, a cut-list item). On every generated `response_items` row store `spice` (0/1/2, the generator's self-label, noisy, do not over-trust) and `gen_temperature`. A per-user `spice_score` (0.0 to 1.0, default 0.5) moves by a small bounded step on reactions; when the behavior turns on, it drives a tone directive in the Challenge and Maggie prompts (the real lever) plus a gentle sampling nudge (`temperature = 0.6 + spice_score * 0.3`, band 0.6 to 0.9, default 0.75), threaded through `callClaude` / `streamClaude`. A three-stop spice control in Settings pins it. Note: with a binary favorite (decision 11), one tap cannot swing the persona, which is the intended safety.

### C.8 Facets as a controlled vocabulary (decision 10)

Facets shift from freeform per-user tags to a shared, curated vocabulary. **Max 50 facets system-wide** (the actual set curated later), and **each user adopts up to 20** of them. This is what makes connections and the Nest's resonance reliable: shared vocabulary means real overlap, where today's freeform tags rarely match. The categorizer picks from the vocabulary rather than inventing tags. Migration note: today `facets` are per-user with `unique(user_id, name)`; the controlled model needs a system facet list plus a per-user adoption cap, and a reconciliation of existing facet names into the 50.

### C.9 Settings, accounts, and accessibility

- **Per-user auth (Phase 1, not first).** Email plus password signup; a real email/SMTP provider (confirmations, resets, and the daily trigger); close the known `www` vs apex callback allow-list gap; retire the shared demo-login as the default entry; keep the existing first-login starter-pack seed (not the flaky AI interest-picker, a cut item). Post-login lands on `/home`.
- **Public read (decision 12) needs no login;** it is a read path over showcase content (C.10), not an auth feature.
- **Settings fields** through `lib/queries/settings.ts`:
  - Account: email (read), change password (via `supabase.auth.updateUser`, the app never handles the raw password), sign out, delete account, timezone.
  - Profile: username, display name, avatar (Supabase Storage `avatars` bucket, URL only), persona name.
  - Behavior: inline resurfacing toggle, spice control, the daily trigger (off / email / text, plus time).
  - **Accessibility (decision 14):** font choice (a short list of common, well-supported fonts plus a dyslexia-friendly option such as OpenDyslexic, mirroring Claude Code's option; applies to reading text, not the brand wordmark), and theme (System / Light / Dark, default Dark).
  - Data: reset to seed, export (stub).
- **Voice (decision 15), the priority right after the core structural work.** The in-app mic uses the browser Web Speech API, which is a dead stub on iOS (the primary platform), so voice capture does not work for most users today. The real fix is **server-side speech-to-text**: record audio in the browser, send it to a transcription API server-side, return text. This is the path that makes "catch a glint by voice in 30 seconds" real on iPhone. Staged as the first thing after the loop and accounts are solid, not in Slice-0.

### C.10 Communities and the public view

Three related things, kept distinct.

1. **The public read view (decision 12).** Showcase content is world-readable. Anyone browses the Grid, curiosities, Facets, and Nest without an account; they never see a dashboard. Implemented as public-read RLS (or a public role) on the designated showcase content, which is otherwise the strict exception to owner-only RLS. This is the honest home for "let people see everything without signing up."

2. **Shared-account communities (Gemini-style, decision 13a).** A group logs into ONE account and co-builds one nest, seeing everything in it. This is the current Gemini-meetup model, kept as a first-class type. **The tension:** personal-habit features (a personal streak, personal adaptive temperature) do not make sense on a shared login, because everyone's signal pools. So on a shared-account community, the **Home dashboard and Settings are admin-only or hidden**, and the account is about the collective nest, not a personal streak. Model this as an account-type flag (`personal` vs `shared_community`) that gates the dashboard and settings, with an admin role for the members who can manage it.

3. **Individual-share nests (decision 13b).** A personal user shares a chosen highlight or favorite into a shared community nest (copy-on-share snapshot, so private thoughts and later edits never leak). Create a nest, invite by link, belong to several; the community view shows only shared items grouped by curiosity, with no personal drilldown. Join-by-token needs a `SECURITY DEFINER join_nest(token)` function (plain RLS cannot enforce a bearer token), and the token should be revocable (not a permanent unrevocable link). This is a NEXT build, distinct from the shared-account model above.

**The flagship 168-topic account (decision 13, the density fix).** Per-user accounts would leave every new user with a sparse Nest and near-zero resonance, gutting the flagship visual that sells the whole brand. Fix: keep the current 168-topic / 15-subject account as the **flagship public community nest**, browsable by everyone (a shared-account community that is also public). It preserves the demo, seeds new users' sense of the graph, and anchors the community feature.

### C.11 Nest: short labels and a 2D/3D toggle

- **Short names help legibility.** The 1-to-3-word rule makes node labels readable on hover, which is the real original problem (100+ topics, unreadable hover). Note: it does NOT increase clustering; the Nest clusters by edges (containment, facet, resonance) in `d3-force`, not by label-string similarity. Keep the change, for legibility, and describe it accurately.
- **2D stays; 3D is an added toggle (locked).** The current 2D `d3-force` view remains the default; a 2D/3D switch adds a rotatable WebGL mode (grab a section, rotate in three dimensions, pinch to zoom). Both read the same `lib/nest/build-graph.ts` output so they never drift. **Chris is building the 3D track with Fable**, in parallel, outside the `[Claude]` sequence. Touch: one-finger drag rotates, two-finger pinch zooms, tap selects; must work at 375px. Deep spec lands in `docs/NEST.md`.

### C.12 On the word "review" (there is no Daily Review feature)

There is no Daily Review surface, screen, or streak gate. The only daily action is catching a glint. When Maggie resurfaces your past glints and curiosities in the Library (C.4), that is the only thing "review" describes: a pull-based, optional look back, on the user's terms, never a daily obligation. If a spaced-repetition ordering of what she resurfaces is ever added, it lives inside the Library's resurfacing, not as a separate surface. The per-topic **Brief** stays a topic mode and is unrelated to any "review."

---

## D. Staged roadmap

### Slice-0: the walking skeleton (prove the loop is fun)

Build behind `/home` on the existing shared account, no per-user auth, no `response_items`, no SMTP. The point is to validate the daily loop by dogfooding it, then decide everything else.

- [ ] **Timezone plumbing.** Add `user_settings.timezone` (IANA, default `America/Los_Angeles`), captured client-side. Everything dated depends on this.
- [ ] **Catch a glint.** A one-line capture on a minimal `/home` that creates a topic (the smart 1-to-3-word entry, optimistic commit). Multiple glints per day allowed.
- [ ] **Glint to connection.** On capture, a Haiku match against existing titles plus facets renders 2 to 3 tappable connection chips; a chip links or promotes. Local index first, LLM enrichment async.
- [ ] **Glint-fired streak.** `activity_days` (covered local dates), current/longest derived, 7-day recovery, timezone-correct. Catching a glint covers today.
- [ ] **Minimal Home.** Today's capture, the streak number, a small activity strip. Nothing else.
- [ ] **`usage_events`.** D1/D3/D7 event logging from day one, so the loop's retention is measurable.

Then dogfood daily for about two weeks. If it does not make you want to open the app tomorrow, none of the rest matters. Pick the one number Slice-0 is trying to move (a candidate: D7 return rate) before building it.

### Phase 1: let real users in

- [ ] Per-user auth plus the Chris-side preconditions (SMTP, callback allow-list, credential rotation, avatars bucket). Retire the shared demo-login as the default entry; keep the starter-pack seed.
- [ ] The public read view (decision 12) over the flagship community nest (decision 13); make the 168-topic account the public showcase.
- [ ] **The daily trigger** (opt-in email or text, ~7am local, Vercel Cron plus Resend, SMS later). This is what actually brings users back; it only works once there are accounts.

### Phase 2: saveable content and voice

- [ ] `response_items` itemization with a generation marker (`generation_id` / `is_current`) so a favorited item's text does not vanish on reroll, and the current-Brief query excludes stale rows. Capture `spice` and `gen_temperature` (columns only).
- [ ] Binary Favorite / Dismiss / Highlight; Highlight routes to Maggie and stores a tagged thought.
- [ ] **Voice, server-side STT** (record audio, transcribe server-side), the priority right after the structural work, because iOS Web Speech is dead.
- [ ] Controlled facet vocabulary (max 50 system-wide, 20 per user).

### Phase 3: depth and the graph gets smart

- [ ] Library resurfacing: Maggie brings back past glints and curiosities (the only thing "review" means, C.12), pull-based, no separate surface.
- [ ] The resurfacing engine (unbranded) feeding the Library.
- [ ] Embeddings (pgvector) only if the graph outgrows one prompt or latency demands it. The chips are already Haiku-semantic from Slice-0 (spike-validated), so this is a scale optimization, not a quality step.
- [ ] Cheap topic-tab reorder (Brief default); hold the Maggie merge.

### Phase 4 and later

- [ ] Individual-share community nests (decision 13b): create, invite-by-token (`SECURITY DEFINER`), the share-only view.
- [ ] Adaptive-temperature behavior turned on; favorite 1-to-10 intensity.
- [ ] Highlight colors, tags, search across curiosities/thoughts, annotations, the full Stats page, Ask Maggie plus Define.
- [ ] Accessibility polish beyond the Settings basics; landing redesign around catch / connect / keep the streak.
- [ ] Markdown export (Obsidian first, Notion deferred for OAuth), pricing tiers (free now, meters instrumented), global streak rank plus milestones, a docs and changelog site.

### Stretch

- [ ] Local-first, offline capture, PWA install (also the only path to iOS web push), native iOS/Android. Design Slice-0 fields (stable ids, `updated_at`, timezone) so this is reachable without a rewrite.

### The cut list (deferred out of the early slices, not deleted)

Adaptive-temperature behavior (keep columns), favorite-10-levels (binary first), the resurfacing/SM-2 engine, the Maggie merge (risky refactor of working code), full Settings plus avatars (Slice-0 needs none), the AI interest-picker onboarding (flaky categorizer; use the starter pack), and the community share affordance (community is later). Nest 3D stays the parallel Fable track.

---

## E. Open decisions with recommendations

Most forks are now settled by Chris (section B). Remaining calls, with recommendations:

| # | Decision | Recommendation |
|---|---|---|
| a | Does a caught glint always become a full topic, or can it stay a "light" note | **Always a topic (a curiosity).** Chris settled "glints = curiosities." Tiny glints connect and can grow; no second-class store to maintain. |
| b | The one number Slice-0 optimizes | **D7 return rate.** The habit either brings you back in a week or it does not. Pick it before building. |
| c | Connection chip: link only, or also spawn/promote | **Both, but link is the default tap.** Spawn/promote is a secondary action so capture stays fast. |
| d | Facet cap read (per user vs per topic) | **Per user (adopt up to 20 from a 50 vocab).** Twenty facets on one topic is nonsense; a personal working set of 20 is the sensible read. Confirm. |
| e | Streak recovery friction | **Free within 7 days, one make-up per missed day.** Generous, per decision 5; the streak must never be the reason to quit. |
| f | Shared-account community dashboard | **Hidden entirely for `shared_community` accounts,** with an admin-only management view. Personal-habit features do not apply to a shared login. |
| g | Light-mode default | **Default Dark, offer Light plus System.** Dark is the brand; Light is a respected option, not the default. |
| h | Trigger channel priority | **Email first, SMS later.** Email is free via Resend and needs only an address; SMS costs per message and needs a phone number and a provider. |
| i | Embeddings timing | **Deferred to scale, not Phase 3.** The spike showed Haiku over the title list already produces great chips at hundreds of topics; add pgvector only when a graph outgrows one prompt or latency demands it. |
| j | Voice approach | **Server-side STT** (not the dead browser API), Phase 2, the priority after structure. |

---

## F. Schema and architecture implications

Every new table keeps owner-only `auth.uid() = user_id` RLS, fronted by typed `lib/queries/` functions. The two deliberate exceptions: public-read on showcase content (C.10), and (later) the `SECURITY DEFINER join_nest` function. Server-first, mobile-first at 375px, no Anthropic SDK in the client.

### Slice-0

- **`user_settings` add:** `timezone text default 'America/Los_Angeles'`. Captured client-side. Must exist before any dated table.
- **`topics` add:** `brief_seed text` (nullable), `raw_input text` (nullable). A glint is a topic; no separate table. (Optional `caught_at`/`origin` marker only if the Library needs to distinguish daily catches from deliberate adds; the streak derives from `created_at` in the user's tz regardless.)
- **`activity_days`** (the streak source of truth):
```
user_id       uuid
activity_date date          -- the user's local date
covered_by    text          -- 'glint' now; extensible
covered_at    timestamptz
primary key (user_id, activity_date)
```
- **`usage_events`** (analytics, from day one):
```
id         uuid pk
user_id    uuid           -- nullable for logged-out/public events
event      text           -- 'glint_caught','connection_tapped','home_open',...
props      jsonb
created_at timestamptz default now()
```
- **`user_settings` cache adds:** `current_streak int`, `longest_streak int` (recomputed on catch).

### Phase 1 and later

- **`response_items`** (Phase 2): `id, user_id, topic_id, mode ('brief'|'challenge'|'questions'), ordinal, content, content_hash, spice smallint, gen_temperature real, generation_id uuid, is_current boolean, favorite boolean default false, dismissed boolean default false, highlighted boolean default false, created_at, updated_at (+ set_updated_at trigger)`. The `generation_id` / `is_current` marker fixes reroll: a reroll writes a new generation and flips `is_current`, so favorited rows persist without their text vanishing, and stale rows are excluded from the current-Brief query. Prune old generations periodically.
- **`user_settings` more adds:** `username`, `display_name`, `avatar_url`, `spice_score real default 0.5`, `spice_override real`, `font text default 'default'`, `theme text default 'dark' check (theme in ('system','light','dark'))`, `trigger_channel text default 'off' check in ('off','email','sms')`, `trigger_time time`, `phone text` (for SMS), and the migrated `default_mode` CHECK (Phase where the tab reorder lands).
- **`account_type`** on the account or `user_settings`: `'personal' | 'shared_community'`, plus a members/roles table for shared-account communities to gate the dashboard and settings (decision 13a).
- **Facets controlled vocabulary** (Phase 2): a system `facet_vocabulary` (max 50) plus per-user adoption (max 20), reconciling the existing freeform `facets`.
- **Public-read** (Phase 1): a `public boolean` (or a showcase-account marker) plus a read policy, for the flagship community nest.
- **Community nests** (Phase 4, decision 13b): `community_nests`, `community_members`, `community_shares` (copy-on-share snapshot), the `SECURITY DEFINER join_nest(token)` function, a revocable token.
- **Deferred:** `thoughts` provenance and `updated_at`; tags and colors; annotations; export tables; api keys and webhooks; subscriptions and meters; streak milestones and a `SECURITY DEFINER` rank aggregate.

### Load-bearing risks

1. **Timezone before dates.** The streak, recovery, and every activity date break without a stored per-user timezone. It is the first Slice-0 task, not an afterthought.
2. **Itemization and the generation marker gate item controls.** Favorite/Dismiss/Highlight and correct reroll are blocked until `response_items` carries `generation_id`/`is_current`. Not in Slice-0.
3. **Public read is a deliberate RLS exception.** Scope it to showcase content only; never weaken owner-only policies on private data. Community join uses `SECURITY DEFINER`, never a relaxed table policy.
4. **Connections are only as good as the facet vocabulary until embeddings land.** The 50/20 controlled vocabulary is what makes NOW connections non-trivial; embeddings are the real fix, staged Phase 3.

### Dormant scaffolding that activates

Group containment (`is_group`, `parent_topic_id`, and the group helpers) is live for Red Rising and Corvids; the pivot makes it the placement step every catch runs. `applyUmbrella` plus `categorizeTopicPrompt` already turn raw input into a titled, filed topic; the pivot adds the `parent_topic` branch and the connection match. RLS is already per-user; auth and the public-read exception are the changes. The settings read/write spine and the `persona_name` field already exist.
