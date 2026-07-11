# Magpie · Business + Product Requirements (BRD / PRD)

**Owner:** Chris Dougherty (dogsled.dev) · **Updated:** 2026-07-10 (Magpie 2.0 pivot) · **Status:** living
**Companions:** `docs/MAGPIE_2.md` (the canonical 2.0 product model, read it for the deep spec), `docs/COMPETITORS.md` (positioning), `docs/PRODUCT.md` (product spec, being updated to 2.0), `docs/MESSAGING.md` + `docs/MICROCOPY.md` (locked copy), `docs/BRAND.md` (voice), `docs/FUTURE_FEATURES.md` (deep backlog), `docs/SOP.md` (the build sequence), `PROGRESS.md` (build log), `HANDOFF.md` (new-session entry point).

Agreed process: **PRD (this doc) + the canonical model (`docs/MAGPIE_2.md`) first, then the build (`docs/SOP.md`).** Same order Chris uses to start every project: define the requirements and the SOP before the real coding.

---

## 0. Snapshot

- **Magpie is BUILT and LIVE at https://magpie.wiki** as a shared-account community: everyone enters through one-click "Enter Magpie" (`dogsled@dogsled.dev`) and grows one shared grid + Nest. The five modes, the Nest constellation, entity groups, Add Topic, Facets, search, and Recent Ideas are all shipped.
- **This document defines Magpie 2.0**, a pivot whose daily habit is the **glint**: you catch a small shiny curiosity in about 30 seconds, Maggie shows how it connects to what you already collect, and catching one glint keeps your streak. The engine draws on Readwise (a daily habit, streaks, a trigger), but the daily unit is the glint, not a spaced-repetition review. The identity stays the conversation gym.
- **The pivot is the primary build track, and it ships glint-first.** A hard adversarial critique (2026-07-10) reshaped the plan: prove the glint loop on the shared account (Slice-0, no auth) before building auth, itemization, or anything heavier. The earlier "Daily Review is the habit" plan was empty for new users and had no trigger, so there is no Daily Review surface at all now; resurfacing past glints just lives in the Library. The LinkedIn launch is parked.
- **The full product model, schema, terminology, and staged roadmap live in `docs/MAGPIE_2.md`.** This PRD is the higher-altitude why, what, when, and how-we-measure.

---

## 1. Vision and one-liner

- **One-liner (locked hero):** *Collect curiosities. Talk them through.*
- **Manifesto:** *Curiosity is charisma, slowed down.*
- **What it is:** a personal **conversation gym**. You build a wiki of the things you find interesting, and **Maggie** (the AI persona) helps you talk them out loud for 3 to 5 minutes.
- **What 2.0 adds:** a daily habit and a memory. You **catch a glint** (a small shiny curiosity), Maggie shows how it **connects** to what you already collect, and catching one glint **keeps your streak**. Over time the collection compounds into a body of thinking you can talk through. Three verbs: **catch, connect, keep the streak.**
- **Terminology (settled):** a **glint** is the catch and the streak unit, a **curiosity** is what it becomes (the user-facing collection word, kept on the homepage), and **topic** is the internal/code term. Same record, three altitudes. No code-wide rename. (Full table in `docs/MAGPIE_2.md`.)
- **Proposed capture phrasing (not locked):** "Catch a glint." The hero stays the only locked line.

## 2. Problem and insight

People are not boring, they are under-rehearsed. Curiosity is the source of charisma, but almost no one practices articulating what they are curious about out loud, and even fewer keep what they figured out. Capture tools store; chat tools answer; neither builds the muscle or brings the good parts back. **Insight:** capture what pulls you, talk it through in short reps, save what lands, and a partner who resurfaces it on a schedule turns scattered curiosity into things you can actually say, and keeps them sharp.

## 3. Target user

- **Primary:** curious knowledge workers, "talkers and thinkers" who want to be sharper in real conversation (dinner parties, meetings, dates, networking). SMB and startup context by default.
- **Secondary:** students, lifelong learners, creators who think out loud, and the note-keeping / personal-knowledge crowd who already live in tools like Readwise, Obsidian, and Notion.

## 4. Positioning and differentiation

Full analysis in `docs/COMPETITORS.md`. The short version, still true in 2.0:

- **The white space:** the AI mind-map category is document-to-diagram. No competitor does voice, talk-it-out, and a persona that remembers. Magpie owns the "conversation gym" quadrant alone. 2.0 deepens the moat by adding the memory and habit loop the category lacks.
- **The moat is behavior + memory + trust**, not the artifact:
  - **Behavior:** the talk-out-loud rep is the product, not an input method.
  - **Memory:** Maggie remembers across topics, and now resurfaces the best of it on a schedule. A relationship, not a feature. The deepest moat, and 2.0 makes it concrete.
  - **Trust:** privacy-first, per-user data isolation (RLS on every table), no ads, yours to keep.
- **On Readwise:** it is the mechanical reference for the retention loop, not the identity. Magpie is a conversation gym with a memory, not a read-later app or a flashcard drill. **Pitch the gym and the memory, not the map.**
- **Table-stakes, not differentiators:** the Nest graph and screenshot capture. Do not lead with them.

## 5. The product

### 5.1 Current shape (live today, pre-pivot)

- **Three dimensions:** Subject × Topic × Facet.
- **Five modes per topic (live order):** the persona-named tab renders **Maggie's chat** and is the default; then **Brief**, **Challenge**, **Questions**; the last tab is **Thoughts** (bullet capture). Note: the code component names are legacy (`ConvoMode` is the chat, `PersonaMode` is the capture).
- **Nav (live):** bottom bar is Grid / Facets / Nest / Rediscover; the wordmark links to the Grid (`/app`).
- **Account model (live):** one shared community account. RLS is already per-user; the shared login just pools all signal under one `auth.uid()`.

### 5.2 Magpie 2.0 shape (what this PRD defines)

Deep spec in `docs/MAGPIE_2.md`. The headline changes:

- **The glint is the daily habit and the streak.** Catch at least one glint (curiosity) per day, about 30 seconds, and you keep the streak. 7-day recovery. "Today" is the user's timezone (PST if unknown). No card-review chore gates the streak.
- **A glint is a curiosity is a topic: one record.** Catching a glint is adding a curiosity. It enters the graph natively and connects for free. No separate glint store.
- **Connections fire at capture.** On catch, Maggie shows 2 to 3 tappable "connects to X" chips from a Haiku semantic match (validated against the real 171-topic graph, `scripts/connection-spike.mjs`). Capture is optimistic (the glint saves instantly, chips animate in a second later), so it stays fast. Embeddings are only a later scale optimization.
- **A daily trigger** (opt-in email or text, ~7am local) pulls the user back. Magpie has none today; it is what actually brings users back, and lands with accounts.
- **A totally public read view.** Anyone browses the Grid, curiosities, Facets, and Nest (the showcase) without signing up; they never see a dashboard. Auth gates only the personal Home and private capture.
- **New nav.** A personal **Home** behind the wordmark (`/home`, gated) is the post-login landing: your capture, streak, activity, stats. **Library replaces Rediscover** in the lower-right. Bottom bar becomes Grid / Facets / Nest / Library.
- **Smart entry plus legible Nest.** 1-to-3-word names; over-3-words seeds the Brief; short names make Nest hover readable (they do not increase clustering, which is edge-driven). Plus a 2D/3D Nest toggle (parallel Fable track).
- **Controlled facets.** Max 50 system-wide (curated later), 20 per user, so connections and resonance are reliable.
- **Communities, three kinds:** the public read view; shared-account communities (Gemini-style, dashboard and settings admin-gated); and individual-share nests (later). The 168-topic account becomes the flagship public community nest, which preserves the demo density and seeds new users.
- **Accessibility Settings.** Font choice (common fonts plus a dyslexia-friendly option like OpenDyslexic) and a theme (System / Light / Dark, default Dark, the magpie black).
- **Voice, done right.** Server-side speech-to-text (iOS Web Speech is dead), the priority right after the core structural work.
- **Deferred (not the daily habit):** any spaced-repetition ordering of resurfacing (it lives inside the Library, there is no Daily Review surface), the topic-interface Maggie merge, item controls with a binary favorite first (1-to-10 intensity later), and adaptive Maggie temperature (columns captured early, behavior later).

## 6. Requirements (staged)

The full checklists, schema, and open decisions live in `docs/MAGPIE_2.md` (sections D, E, F). Summary here; sequence and ownership in `docs/SOP.md`.

**Slice-0 (prove the loop, no auth).** On the shared account, behind `/home`: timezone plumbing, catch-a-glint capture, glint-to-connection chips, the glint-fired streak (7-day recovery), a minimal Home, and `usage_events` analytics. Then dogfood for about two weeks against one metric (candidate: D7 return rate). This is the whole gate; nothing else builds until the loop is fun.

**Phase 1 (let real users in).** Per-user auth plus the Chris-side preconditions (SMTP, callback allow-list, credential rotation); the public read view over the flagship community nest; the daily trigger (email now, SMS later).

**Phase 2 (saveable content and voice).** `response_items` itemization with a generation marker (fixes reroll); binary Favorite / Dismiss / Highlight; server-side voice; the controlled facet vocabulary.

**Phase 3+ .** Library resurfacing of past glints (the only thing "review" means, no separate surface); the resurfacing engine; embeddings for real connections; the cheap tab reorder. Then individual-share community nests, adaptive-temperature behavior, favorite 1-to-10, colors/tags/search/stats, accessibility polish, the landing redesign, export, pricing, streak rank.

**Stretch.** Local-first, offline capture, PWA install (also the path to iOS web push), native iOS/Android.

**Cut from the early slices** (deferred, not deleted): adaptive-temperature behavior, favorite-10-levels, the resurfacing/SM-2 engine, the Maggie merge, full Settings plus avatars, the AI interest-picker, and community share.

### 6.1 Non-negotiables that carry through every stage

- **Per-user RLS on every new table** (`auth.uid() = user_id`, join tables gate through the parent). No service-role key in the client. The only deliberate exceptions are public-read on showcase content and a `SECURITY DEFINER` community-join function; never weaken owner-only policies on private data.
- **The `lib/queries/` spine is the single source of truth** for UI and any AI or API path. Never duplicate query logic.
- **Mobile-first at 375px.** Every new surface (Home, Library, item controls, the streak calendar) designed on the phone first.
- **No Anthropic SDK in the client.** All model calls stay in `app/api/ai/*`.
- **No em dashes** anywhere. No invented taglines or microcopy; pull from `MESSAGING.md` / `MICROCOPY.md`, ship feature names otherwise.

## 7. Security precondition (Phase 1, before real signups)

Slice-0 runs on the shared account and needs none of this. Phase 1 (per-user auth) does: before real accounts exist, **rotate the leaked credentials in public git history** (rotation is the only thing that closes them):

- **[Chris]** App account `dogsled@dogsled.dev` password (Supabase, Authentication, Users).
- **[Chris]** Database password `SUPABASE_DB_PASSWORD` (Supabase, Project Settings, Database, Reset), then update the local env on both machines.
- Nothing running depends on either value (login rides the passwordless service-role path), so rotation is safe and non-breaking. The steps also live in the untracked `qc-audit/OWNER_ACTIONS.md` section 1 on Chris's machine.

Also migrate the Supabase `service_role` value to `sb_secret_` before end of 2026 (deprecation deadline).

## 8. Go-to-market

- **The pivot is the focus, so GTM waits for the new experience.** The LinkedIn launch post (drafted, `docs/LINKEDIN_LAUNCH.md`, og image done) is parked until the 2.0 slice is real, so the post lands on the better product. It stays publishable on the current app if Chris changes his mind on timing.
- **When 2.0 ships:** the story is the daily loop (catch a glint, watch it connect, keep the streak) and the public showcase nest anyone can browse without signing up. The LinkedIn post, the Gemini presentation, and a Loom demo all re-cut around it.
- **Later:** a docs and changelog site whose IA mirrors the loop, and community nests as a viral surface.

## 9. Success metrics

The North Star is a sustained daily habit built on the glint.

- **North Star:** **D7 return rate** (do users come back a week later) and **7-day and 30-day retained streak counts**. Pick and instrument this in Slice-0 via `usage_events`.
- **Activation:** % of new users who catch a glint and tap a connection chip in week 1.
- **Engagement:** glints caught per week, connection chips tapped per glint, curiosities that grow past a single line, favorites/highlights per week (once item controls ship).
- **Retention:** weekly active, current and longest streak distribution, trigger open-through rate (email/text), Library revisits.
- **Virality (later):** public-view traffic, signups from the showcase, shares to community nests.

## 10. Tech and infrastructure

- Next.js 15 (App Router, TS strict), Supabase (Postgres + RLS + Auth + Storage), Anthropic (Sonnet 4.5 `claude-sonnet-4-5-20250929`, Haiku 4.5 `claude-haiku-4-5-20251001`), Vercel, Tailwind + shadcn/ui. New in 2.0: a mail provider (Resend) and Vercel Cron for the daily trigger; an SMS provider (Twilio) later; a transcription API for server-side voice; pgvector for embeddings (Phase 3).
- **Krava and Linq are being removed** (branch `chore/remove-krava-linq`); out of the 2.0 stack. AI calls go straight to Anthropic server-side.
- The `lib/queries/` spine is the single source of truth (UI + AI + any future API).
- **Slice-0 tables:** `activity_days` (the streak source of truth), `usage_events` (analytics), plus column adds `user_settings.timezone`, `topics.brief_seed`, `topics.raw_input`. Later tables (`response_items` with a generation marker, facet vocabulary, community nests, and the `user_settings` profile/theme/trigger adds) are in `docs/MAGPIE_2.md` section F. Timezone must land before any dated table.

## 11. Open questions / decisions

Settled in batch 3: **the glint is the daily habit and the streak** (Daily Review demoted); **glint = curiosity = topic** (one record, no rename); **Slice-0 before auth**; **the trigger is opt-in email or text**; **7-day streak recovery**; **timezone or PST**; **facets capped at 50 system-wide, 20 per user**; **the 168-account becomes the flagship public community nest**; **binary favorite first**; **light mode offered, default dark**; **dyslexia-friendly font option**; **server-side voice after the core work**. Earlier settled: pricing (free now), the public read view, two community models. Recommendations for the rest are in `docs/MAGPIE_2.md` section E. The ones still wanting Chris's explicit call:

- **The one number Slice-0 optimizes** (recommended: D7 return rate). Pick it before building.
- **Facet cap reading** (recommended: 20 per user, not per topic). Confirm.
- **Shared-account community dashboard** (recommended: hidden for `shared_community` accounts, admin-only management).
- **Trigger channel priority** (recommended: email first via Resend, SMS later via Twilio).
- **Embeddings timing** (recommended: Phase 3, after keyword/facet chips prove the UX).
- **Paid tier line:** what eventually sits behind it (export, API, scale), once metering shows the cost.
- **Global streak rank and physical rewards:** deferred; the population threshold to turn rank on.
