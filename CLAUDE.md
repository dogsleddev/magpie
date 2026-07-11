# Magpie

This is the project context for **Magpie**, a personal conversation gym. Read this file first. It is the North Star.

For deep detail on any section, follow the pointers to `docs/`.

> **Magpie is pivoting to 2.0 (glint-first), as of 2026-07-10.** The current product direction lives in `docs/MAGPIE_2.md` (the canonical model), `docs/BRD.md` (the PRD), `docs/SOP.md` (the build plan, Slice-0 first), and `HANDOFF.md` (the entry point). In 2.0 the daily habit is the **glint**: catch a curiosity in about 30 seconds, Maggie shows how it connects, and catching one keeps a streak. A **glint**, a **curiosity**, and a **topic** are the same record (the catch, the user-facing collection word, and the code entity). The sections below still describe the product as it is LIVE today (pre-pivot), which remains accurate for the running app, but where they describe direction, navigation, modes, or roadmap, the 2.0 docs win.

---

## What we're building

Magpie is a mobile-first web app for people who love to talk and think out loud. Users build a personal grid of conversation topics they care about. The app gives them fresh angles on those topics in seconds, helps them riff for 3 to 5 minutes, and captures what they said. Over time the grid grows, notes compound, and adjacent topics surface.

**One-line product:** Collect curiosities. Talk them through.

**Production domain:** `magpie.wiki`

**The metaphor:** A magpie collects shiny things. Topics are the user's shiny things. The app is the nest.

**The persona:** An in-app AI character named **Maggie** (renameable in settings) who shows up in two places: the bullet capture mode (named after the persona) and the chat mode (Convo). Maggie's voice is lowercase, casual, friend-at-party energy. Never starts with "Great question!" or "That's interesting!"

---

## Current status (read first)

- **Direction note (2026-07-10):** the active work is the **Magpie 2.0 glint-first pivot** (see the banner above and `docs/MAGPIE_2.md`). The bullets below are the pre-pivot LIVE state, still true for the running app; they are not the 2.0 plan.
- **It is all committed and LIVE at magpie.wiki.** Master auto-deploys to production. (Full build log: `PROGRESS.md`.)
- **Repo checkout: `C:\dev\magpie` (since session 13, 2026-06-10).** The repo moved out of OneDrive after a sync incident dehydrated source + `.git` mid-session and rolled master back a commit (recovered from origin). GitHub is the sync between Chris's two machines; unfinished work travels on WIP branches because master auto-deploys. Do not work from the old `OneDrive\02_Projects\Magpie\code` path; it is being archived. The dogPC still needs its clone + `.env.local`.
- **Community curation (session 15, live):** 5 duplicate topic pairs merged on the community DB with zero data loss (facets carried onto the keeper, empty copy deleted), the Yellowstone keeper retitled to "Why wolves changed the path of rivers in Yellowstone", and the Seahawks + basketball topics refiled from Hobbies to Sports. Now 168 topics / 15 subjects. Script: `scripts/merge-dupes.mjs` (idempotent, dry-run default, `--write`). Two pairs were judged distinct and kept on purpose (PROGRESS session 15 has the list); do not re-flag them.
- **Gemini meetup demo (session 14, live):** a second one-click shared account `gemini@dogsled.dev` seeded with the "Gemini Meetup" group (6 topics, 3 ideas each, all AI-themed). `magpie.wiki/gemini` is the QR direct link (route handler signs in + redirects to `/app`), the landing has a "Join the meetup nest." section (`id="gemini"`, QR + button, between Share-the-nest and the count band), and the data is managed by `scripts/setup-gemini-account.mjs` + `scripts/seed-gemini-content.mjs` (both idempotent, dry-run default, `--write` to execute). Login rides the passwordless service-role path; no new env. Remove the landing section after the event.
- **Landing round 2 + Nest overlay nav (session 13, live):** the Nest section pitches "your nest" ("See your nest of curiosities and topics as a living constellation."), the hero/metadata say **interesting** (the word "shiny" lives only where it self-explains: the Glints definition line and the Pull-never-push card), Glints is finally explained and anchored to Rediscover, a **Share the nest** section ("Build a nest together.", group accounts teased) sits directly under the constellation, the why headline is "Notes that come back to you.", and the full-bleed Nest view carries the bottom tab bar as a floating pill (Grid / Facets / Nest / Rediscover).
- **The Nest mind map is built and shipped.** It replaced the Journal tab: a force-directed constellation of the whole wiki with three dimensions (Subject to Topic to Sub-topic containment, the cross-subject Facet web, and emergent Resonance). Full details in `docs/NEST.md`. Live at the `/nest` tab and embedded on the landing. It has a **Desktop** toggle (full-screen overlay + docked control panel) and a `subjectsOutside` option. **The Nest tab opens straight into the full-bleed view on every viewport, phones included** (session 12); small screens start with the control panel collapsed, and exiting back to the compact view sticks for the visit.
- **Entity groups (sessions 11 + 12, live):** topics that belong to the same named entity (book series, team, show, franchise) nest under a shared group parent. **Red Rising** and **Corvids** are live groups on the community DB. Every new topic runs the **umbrella check** (`applyUmbrella` in `lib/actions/topics.ts`); conservative, never blocks the add. **Groups are a real drilldown in the UI now (session 12):** a subject list shows one row per group (Layers icon + sub-topic count), clicking it opens the collection page that lists its children, child topics back-link to the group, and the group page adds sub-topics through Maggie (an explicit add into a group skips the umbrella check, the user's placement wins). No schema change was needed; `is_group` + `parent_topic_id` were already live.
- **Homepage (sessions 11 + 12, live):** hero now has exactly **two CTAs** ("See the community nest" primary, "Add a curiosity" secondary), the inline waitlist form sits under the community count band (the visual peak), the "Why Magpie" grid is the trust trio only (Pull never push / No ads. Ever. / Yours to keep), the five-modes section matches the real app tabs, and the add-topic dialog says "Add a curiosity" everywhere so the landing language carries into the app.
- **`public/brand/og-nest.png` EXISTS (session 12):** a generated 1200x630 constellation in the plumage palette, serving on prod, so LinkedIn/Twitter cards have art. Regenerate anytime with `node scripts/generate-og-nest.mjs`.
- **Welcome hint dismissal persists** via the `magpie_hint_dismissed` cookie (read server-side in `app/(main)/app/page.tsx`, set in `components/home/welcome-hint.tsx`).
- **Also shipped previously (all live):** **Rediscover** (bottom-bar tab spins to a random topic), **Maggie's per-topic AI opener** (`/api/ai/convo-opener`, in-memory cached), **Sports** subject, facet chips that link to `/facets/[id]`, quiet **delete-topic**, mic-to-text, Organize, landing Nest showcase + inline waitlist, og/twitter metadata, in-app header waitlist CTA, footer contact pointing to Chris's LinkedIn.
- **Launch mode: shared-account community.** Everyone enters the same `dogsled@dogsled.dev` account ("Enter Magpie") and grows one shared grid + Nest. Per-user private accounts are deferred to post-waitlist (RLS + seed-on-first-login already support them).
- **iOS mic (live, unverified on-device):** WebKit Web Speech is a dead stub on iOS, so the in-app mic is hidden and a **"voice on mobile coming soon. type for now."** hint shows (`components/topic/persona-mode.tsx`, `convo-mode.tsx`; detection in `components/mic/is-ios.ts`). Test on Chris's iPhone.
- **Open right now:** present at the **Gemini meetup** (everything staged and verified; optionally add more items to the meetup nest in-app, and delete the landing `#gemini` section after the event). Publish the **LinkedIn post** (draft in `docs/LINKEDIN_LAUNCH.md`; og image DONE, screenshots ready, @handles added at post time). Verify the iOS "coming soon" hint and the mobile Nest default on Chris's iPhone. The carryover QC backlog + the `service_role` -> `sb_secret_` migration (deprecated **end of 2026**) are in `PROGRESS.md`.
- **Local login** needs `SUPABASE_SERVICE_ROLE_KEY` (or `DEMO_LOGIN_PASSWORD`) in `.env.local` (it reads the file, not Vercel).

---

## The user (Chris)

This project is being built by Chris, a finance professional / solo builder operating under the `dogsled.dev` brand. When you (Claude Code) work with him, match this register:

- **High-energy, casual, surfer-bro voice** during working sessions ("brudha", "stoked", "rad", "let's go")
- **Refined professional tone** for client-facing deliverables, anything involving his co-founder Jessica, or anything in `fastinsights.io`
- **No em dashes** in any publishable copy or code comments. Em dashes are an AI-tell he doesn't like. Use periods, commas, parentheses, or colons instead.
- **Default context: small business and startups.** Do NOT surface AEC content unless he asks for it.
- **PowerShell syntax** for all CLI instructions (Windows 11 environment, repo checkout: `C:\dev\magpie`)
- Direct feedback expected; no excessive hedging
- Likes diagrams and visual mockups to align before coding
- When he asks for product-level names, propose options instead of defaulting to one

If you find yourself writing a long preamble, cut it. He prefers signal over throat-clearing.

---

## Stack

- **Next.js 15** (App Router) + **TypeScript** (strict mode)
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** (Postgres + RLS + Auth)
- **Anthropic Claude API** via `@anthropic-ai/sdk` (no OpenAI, no Gemini in production app)
- **Vercel** for deploy
- **magpie.wiki** as the production domain

Versions and exact dep list: see `package.json`.

---

## Architectural patterns

### The `lib/queries/` spine

Every database operation lives in a typed query function under `lib/queries/`. These functions are the single source of truth, consumed by BOTH UI (Server Components / Server Actions) AND AI tool handlers (when we add them). NEVER duplicate query logic across UI and AI paths.

```ts
// lib/queries/topics.ts
export async function getTopicsBySubject(subjectId: string): Promise<Topic[]>;
export async function getTopicsByFacet(facetId: string): Promise<TopicWithSubject[]>;
export async function createTopic(input: CreateTopicInput): Promise<Topic>;
```

This is the same pattern Chris uses across his other dogsled.dev projects. Stick to it.

### Server-first

Default to Server Components and Server Actions. Use Client Components only for things that require client-side interactivity: forms, inputs, modals, mic capture, the bullet edit state machine. Always mark client components with `"use client"` at the top of the file.

### RLS everywhere

Every Supabase table has Row Level Security ON with policies tied to `auth.uid()`. No public tables. No service-role client on the browser. Server-side actions use the SSR client with cookies. The schema in `supabase/migrations/0001_init.sql` is the source of truth.

### Cache AI responses where it makes sense

Brief and Challenge content is cached in the `ai_cache` table per topic, so revisits are instant. Reroll deletes the cache entry and re-calls. Convo is streamed and stored in `conversations`. Organize results are ephemeral (not cached).

---

## Code style

- **TypeScript strict** mode, no `any` unless you've genuinely tried and need to escape hatch with a comment explaining why
- **Prettier** defaults (`npx prettier --write .`)
- **File naming:** kebab-case for utilities and route segments, PascalCase for components
- **Component files:** default-export the main component, one component per file
- **Imports order:** external → internal absolute (`@/...`) → relative → types
- **No em dashes** anywhere. Not in code, not in comments, not in commit messages, not in UI copy.
- **CSS:** Tailwind classes inline. No styled-components, no CSS-in-JS. Design tokens live as CSS variables in `app/globals.css` (imported from `styles/tokens.css`).
- **Comments:** sparse. Code should self-document. Use comments for non-obvious reasoning, not for narrating what the code does.

---

## Vocabulary (matters)

| Term        | Meaning                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Subject** | Parent category (History, Music, AI). Topics live inside subjects.                                                                                                                   |
| **Topic**   | The conversation prompt. The thing the user actually riffs on. The entity.                                                                                                           |
| **Facet**   | Cross-cutting tag (paradox, fun facts, future, evolution). One topic can have multiple facets, and facets cross subjects. Browsing by Facet gives a different lens on the same data. |
| **Thought** | One captured bullet inside a topic. User's words.                                                                                                                                    |
| **Maggie**  | Default persona name. Renameable. The persona-named mode is the bullet capture mode. The Convo mode is the chat with the persona.                                                    |
| **Mode**    | One of the five tabs inside a topic: {persona}, Brief, Challenge, Questions, Convo.                                                                                                  |
| **Grid**    | The home view, organized by Subject.                                                                                                                                                 |
| **Riff**    | The act of talking out loud about a topic for 3 to 5 minutes. Used as a verb. Not the name of the mode anymore (mode is named after the persona).                                    |

**Important rename from the v1 reference:** the v1 artifact uses `angles` in the data model. In production, this is renamed to `facets`. Carry the rename through schema, queries, UI, and copy.

---

## V1 reference artifact

`docs/magpie-v1-reference.html` is a working single-file HTML prototype. Open it in a browser to see the design, the copy, the interaction patterns, and the AI prompts in action. The visual design, copy, and interaction patterns port faithfully to the Next.js app.

The reference uses `window.storage` for persistence and inline JS state. The production app uses Supabase and Server Actions. Same UX, different plumbing.

**What ports as-is from the reference:**

- The plumage palette (black, off-white, teal, blue, purple)
- Font choices (Fraunces + DM Sans)
- The home screen layout (two-button row + subject list)
- The topic detail layout (meta pills + title + mode tabs + mode content + organize result + related section + save & spin)
- The bullet capture interaction (input + list + edit/delete)
- The mode tab interaction
- All four AI prompts (verbatim, then refined as needed)
- The seed topic content
- The Add Topic modal (AI assist + manual)
- The Settings modal layout

**What changes from the reference:**

- `angles` → `facets` (rename everywhere)
- `notes` string was already deprecated to `thoughts` array in the v1.5 iteration: port the array version
- The "Riff" mode tab is renamed to the persona name (default "Maggie"). When persona is renamed, the tab label updates.
- Default mode (the tab that's active on topic open) is the persona-named mode.
- Input placeholder in the persona-named mode: **"What's on your mind?"** (was "What's coming up?")
- Every text input gets a **mic-to-text** button using Web Speech API
- New navigation: **browse by Facet** view (cross-subject lens)
- Auth: users sign up and have private grids. The seed data lives in `lib/seed/starter-topics.ts` and is inserted on first login.

---

## AI integration

Full prompts: `docs/PROMPTS.md`. Typed factory functions ready to use: `lib/ai/prompts.ts`.

- **Sonnet** (`claude-sonnet-4-5` or current) for: Challenge, Convo, Organize, Extract
- **Haiku** (`claude-haiku-4-5` or current) for: Brief, Related
- All API calls server-side in `app/api/ai/*/route.ts` routes. No API key in client bundles.
- Brief and Challenge responses cached in `ai_cache` table per topic.
- Convo uses streaming (Server-Sent Events) for typing-indicator feel.

---

## Speech-to-text

Every text input in the app has a mic button. Uses the **Web Speech API** (`window.SpeechRecognition || window.webkitSpeechRecognition`). Implementation lives in `components/mic/use-speech-to-text.ts` as a reusable hook and `components/mic/mic-button.tsx` as the UI primitive.

Behavior:

- Tap mic to start recording. Mic pulses. Live transcription appears in the input field.
- Tap again to stop. Final transcript is committed.
- If the browser doesn't support the API (Firefox, older browsers), the mic button shows as disabled with a tooltip.

---

## Build sequence

Full plan: `docs/BUILD_PLAN.md`. Phased build, each phase shippable. Do not skip ahead. The 10-hour prototype targets phases 1 through 5 plus minimal polish, not the full sequence. See `docs/BUILD_PLAN.md` Phase 8 polish notes for what to fake vs ship real in the prototype.

**MVP path (phases 1 through 9):**

1. **Scaffold + Auth**: Next.js init, Tailwind, shadcn, Supabase auth (magic link), brand chrome
2. **Schema + Queries**: Apply migrations, generate types, write `lib/queries/*` (the schema already includes dormant Option 2 columns ready for Phase 5.5)
3. **Home + Subject Navigation**: Browse by Subject, drill into topics
4. **{persona} mode (bullet capture)**: Bullets, mic, timer, organize
5. **AI modes**: Brief (Haiku), Challenge (Sonnet), Questions (Haiku), Convo (Sonnet streaming) with pacing rules baked in
6. **Facets navigation**: Browse by Facet, cross-subject views
7. **Discover + Add Topic**: Discover queue, AI-assist add, manual add
8. **Settings + Polish**: Persona rename, AI toggle, Glints toggle, default mode, notes journal, onboarding
9. **Deploy**: Vercel, magpie.wiki, analytics

**Post-MVP (phases 5.5 and 9.5 onward):**

- **5.5: Topic Groups + Level 2 cross-context**: Activate the dormant `is_group` and `parent_topic_id` columns. Group-level Convo synthesizes across child threads. Ship pacing rules with it.
- **9.5: Desktop responsive (full)**: Two-pane layouts, left rail, reading widths. See `docs/RESPONSIVE.md`.
- **10: Glints**: Inward surfacing on home, topic page, and inline-in-Convo. Distinct from Discover (which proposes new). See `docs/FUTURE_FEATURES.md`.
- **11: Nest View**: Force-directed constellation graph of the wiki. See `docs/FUTURE_FEATURES.md` and the working visual reference at `docs/magpie-v1-reference.html`.
- **12: Draw Out**: The charisma flagship. See `docs/CHARISMA.md`.

---

## Reference docs in this repo

- `docs/PRODUCT.md`: full product spec (modes, flows, navigation, persona)
- `docs/BRAND.md`: colors, typography, voice, mark, do's and don'ts
- `docs/MESSAGING.md`: locked tagline hierarchy: which line goes on which surface
- `docs/SCHEMA.md`: Supabase schema with rationale and RLS policies
- `docs/PROMPTS.md`: all AI prompts with model selection
- `docs/BUILD_PLAN.md`: phased build with deliverables per phase
- `docs/CHARISMA.md`: the conversational-charisma layer: Questions mode (MVP) and Draw Out mode (flagship)
- `docs/MEMORY.md`: how Maggie's cross-context awareness grows across four levels, plus the pacing rules that govern her conversation behavior
- `docs/RESPONSIVE.md`: mobile-first plus a beautiful desktop layout, including the left rail pattern and reading-width discipline
- `docs/FUTURE_FEATURES.md`: post-MVP roadmap including Glints, Nest View, and Personalized Surfacing principles
- `docs/NEST.md`: **the Nest mind map, BUILT and shipped** (replaces the Journal tab). Architecture, the 3-dimension model, surfaces, community mode, and the Supabase key-migration note. Read this for the current state of the flagship visual feature.
- `docs/brand-page.html`: working brand showcase, open in any browser
- `docs/magpie-v1-reference.html`: v1 prototype, open in browser

## Brand assets in this repo

- `public/brand/magpie-mark.png`: the mark (long-tailed magpie + teal shiny dot)
- `public/brand/magpie-mark-small.png`: same, smaller, for lockups
- `public/brand/icon-512.png`, `public/brand/icon-192.png`: app icon sizes
- `public/brand/favicon-32.png`, `public/favicon.png`: favicon
- Before launch, vectorize the mark and replace the PNGs with a clean SVG. See BRAND.md.

## Code that's already written

- `supabase/migrations/0001_init.sql`: apply this first to set up the database
- `lib/ai/prompts.ts`: typed prompt factory functions (includes Questions and the Draw Out scaffolds)
- `lib/ai/client.ts`: Anthropic SDK client wrapper
- `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`: Supabase SSR clients
- `lib/seed/starter-topics.ts`: curated starter pack for new users (now activates the Red Rising group via `is_group`/`parent_topic_id`)
- `styles/tokens.css`: the plumage palette as CSS variables
- `app/globals.css`: Tailwind + tokens import
- `lib/nest/*`, `lib/queries/nest.ts`, `components/nest/*`, `app/(main)/nest/page.tsx`: the **Nest** mind map (force-directed constellation, replaces Journal). Single-source transform in `lib/nest/build-graph.ts`. See `docs/NEST.md`.
- `lib/actions/backfill-red-rising.ts` + `app/api/dev/backfill-red-rising/route.ts`: one-time dev-only backfill to group Red Rising on accounts seeded before the group existed.
- `docs/nest-portable.html` (self-contained, opens offline), `docs/nest-desktop.html` (desktop-locked reference), `docs/nest-prototype.html` (served prototype).

---

## Gotchas

- **Mobile-first is non-negotiable.** Design and test every screen at 375px first. Desktop is centered phone-frame styling.
- **Persona name renaming** must update ALL UI references in real time: the tab label, the input placeholder, the empty-state copy, the convo header, the welcome hint. Don't hard-code "Maggie" anywhere except as the default value.
- **Window storage and localStorage are NOT used.** The v1 reference uses them; the production app uses Supabase exclusively.
- **No client-side Anthropic SDK.** All AI calls go through `/app/api/ai/*` server routes.
- **Speech API browser support is uneven.** Show a fallback for unsupported browsers; do not break the UI.
- **Auto-save freshly captured thoughts.** Don't make the user hit "Save." The action of pressing Enter or stopping the mic IS the save.
- **The persona-named mode is the DEFAULT TAB** on topic open. The order of tabs is: `{persona}` → `Brief` → `Challenge` → `Questions` → `Convo`.

---

## What "done" looks like

**Phase 1 done:** Chris can sign up, log in, see the empty Magpie home screen with the brand chrome.

**Phase 4 done:** Chris can pick a topic, capture thoughts with mic-to-text, see them as bullets, edit them, organize them with AI.

**Phase 9 done:** Magpie is live at magpie.wiki, anyone can sign up, all four modes work, all three navigation dimensions (Subject, Topic, Facet) are browsable.

Start with `docs/BUILD_PLAN.md`. Then `docs/SCHEMA.md`. Then build.
