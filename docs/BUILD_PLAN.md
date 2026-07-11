# Magpie · Build Plan

> **Magpie is now 2.0 (glint-first).** Canonical product model: [MAGPIE_2.md](MAGPIE_2.md). Build plan: [SOP.md](SOP.md). This doc predates the pivot; where it describes the daily habit, navigation, modes, or roadmap, MAGPIE_2.md wins (the current build order is Slice-0 then phases in SOP.md, not the 9 phases below). Still valid as history: this is the record of how the live app was actually built, and the per-phase deliverables (schema, queries, the AI modes, the Nest) describe real shipped code.

A 9-phase build. Each phase ships. No skipping ahead.

---

## Phase 1: Scaffold + Auth

**Goal:** A signed-in user sees an empty branded Magpie home screen.

**Steps:**

1. Initialize Next.js 15 in PowerShell:
   ```powershell
   npx create-next-app@latest magpie --typescript --tailwind --app --import-alias="@/*" --no-src-dir
   cd magpie
   ```
2. Install dependencies:
   ```powershell
   npm install @anthropic-ai/sdk @supabase/supabase-js @supabase/ssr lucide-react
   npm install -D @types/node
   ```
3. Initialize shadcn:
   ```powershell
   npx shadcn@latest init
   ```
   Style choices when prompted: New York, Zinc base, CSS Variables yes.
4. Copy in design tokens from `styles/tokens.css` and reference them from `app/globals.css`.
5. Set up Google Fonts in `app/layout.tsx` (Fraunces + DM Sans).
6. Create Supabase project. Copy URL and anon key to `.env.local` (template in `.env.example`).
7. Apply the schema migration: `supabase/migrations/0001_init.sql`.
8. Build `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts` using SSR pattern.
9. Build auth pages: `app/(auth)/login/page.tsx` with magic link form, `app/(auth)/callback/route.ts` for the OAuth dance.
10. Build the `(main)` route group with `layout.tsx` providing the app bar + bottom tab bar shell.
11. Build the empty home page: brand wordmark, "Welcome" copy, Add topic + Convo Roulette buttons disabled until topics exist.

**Done when:**
- `npm run dev` boots clean
- Magic link signup works end to end
- Authenticated user lands on a Magpie-branded empty home screen
- Dark mode default, Fraunces wordmark visible

---

## Phase 2: Schema + Queries

**Goal:** Every query function in `lib/queries/*` exists with full TypeScript types. Smoke tests pass.

**Steps:**

1. Apply the schema if not done in Phase 1.
2. Generate types: `npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts`
3. Build out every query module listed in `docs/SCHEMA.md` → "Query patterns":
   - `lib/queries/subjects.ts`
   - `lib/queries/topics.ts`
   - `lib/queries/facets.ts`
   - `lib/queries/thoughts.ts`
   - `lib/queries/conversations.ts`
   - `lib/queries/discover.ts`
   - `lib/queries/ai-cache.ts`
   - `lib/queries/settings.ts`
4. Each query uses the server-side Supabase client and respects RLS automatically.
5. Build the onboarding seed action: `lib/actions/seed-starter-topics.ts` that takes `lib/seed/starter-topics.ts` and inserts subjects, topics, and facets for the new user.

**Done when:**
- Every query function compiles with strict types
- Manual test in a Server Component: list subjects, create a topic, list topics by subject, all work
- Starter seed action populates 8 subjects + ~30 topics + ~10 facets for a fresh user

---

## Phase 3: Home + Subject Navigation

**Goal:** A user with seed data can browse Subject → Topic.

**Steps:**

1. Build `app/(main)/page.tsx` (home grid):
   - Welcome hint (dismissible) for first-time users
   - Add topic + Convo Roulette buttons
   - `<SubjectList>` Server Component fetching `getSubjectsWithCounts()`
   - Each row tappable
2. Build `app/(main)/subject/[id]/page.tsx`:
   - App bar with back button and subject name
   - `<FacetChips>` Client Component showing facets used in this subject, with active state
   - `<TopicList>` Server Component fetching `getTopicsBySubject(id)`, filtered client-side by active chip
3. Build `app/(main)/topic/[id]/page.tsx`:
   - Static layout only this phase: meta pills, title, mode tabs, mode content placeholder
   - The four mode tabs render but only the `{persona}` tab shows actual content (deferred to Phase 4)
4. Build `<BottomTabBar>` with Grid / Facets / Discover / Journal. Active state tied to route. [Nav evolved: the live bottom bar is Grid / Facets / Nest / Rediscover (Journal was replaced by the Nest). In 2.0 it becomes Grid / Facets / Nest / Library, with Home behind the wordmark; see MAGPIE_2.md C.2.]
5. Implement Convo Roulette: a Server Action that calls `spinRandomTopic()` and redirects to `/topic/[id]`.

**Done when:**
- Tap a subject → see topics filtered by facet chip
- Tap a topic → see the layout with the four mode tabs (only `{persona}` tab content is real)
- Tap Convo Roulette → land on a random topic
- Bottom tab bar navigates between Grid / Facets / Discover / Journal placeholders

---

## Phase 4: `{persona}` mode (bullet capture)

**Goal:** Users can capture thoughts as bullets, edit, delete, with mic input. Timer optional. Organize button works.

**Steps:**

1. Build `components/topic/persona-mode.tsx` (Client Component) with:
   - The riff timer pill (start/pause/reset)
   - Input field with placeholder "What's on your mind?" + mic button + Add button
   - List of bullets via `<ThoughtBullet>` components
   - Each bullet click-to-edit, hover X to delete
   - "Organize with AI" button appears when bullets >= 3
2. Build `components/mic/use-speech-to-text.ts` hook using Web Speech API with feature detection.
3. Build `components/mic/mic-button.tsx` reusable UI primitive (pulses while recording).
4. Wire the bullet handlers to Server Actions:
   - `createThought(topicId, content)` 
   - `updateThought(id, content)`
   - `deleteThought(id)`
5. Build `app/api/ai/organize/route.ts` server route that takes thoughts, calls Sonnet with the Organize prompt, returns structured JSON. Side effect: insert `learn_more` items into `discover_items` if `ai_suggestions` is on.
6. Render organize result outside the persona card so it persists across thought adds.

**Done when:**
- User types "test thought" + Enter → bullet appears, saved to Supabase
- User taps mic → browser permission prompt, then transcript appears in input
- User taps a bullet → edits inline → blur saves
- User taps X → bullet deletes
- User taps Organize → loading spinner → structured insights/counters/followups/learn_more renders
- `learn_more` items appear in the Discover queue

---

## Phase 5: AI modes (Brief, Challenge, Questions, Convo)

**Goal:** All five mode tabs functional.

**Steps:**

1. Build `app/api/ai/brief/route.ts`:
   - Check `ai_cache` for cached Brief; return if exists
   - Otherwise call Haiku with Brief prompt, store in cache, return
2. Build `app/api/ai/challenge/route.ts` (same pattern with Sonnet).
3. Build `app/api/ai/questions/route.ts` (same cache pattern with Haiku, using `questionsPrompt`). Mode key `questions`.
4. Build `components/topic/brief-mode.tsx`, `components/topic/challenge-mode.tsx`, and `components/topic/questions-mode.tsx`:
   - Show cached content if available
   - Show loading spinner while fetching
   - Reroll button: deletes cache, re-fetches
5. Build `app/api/ai/convo/route.ts`:
   - Streaming endpoint using SSE
   - Pass conversation history + persona name to Sonnet
   - On completion, append both user message and assistant response to `conversations.messages`
6. Build `components/topic/convo-mode.tsx`:
   - Chat UI with message bubbles
   - Input field at bottom with mic + send button
   - Typing indicator while waiting for first token
   - Streams tokens into the assistant message bubble
7. Build `components/topic/mode-tabs.tsx` with active state and tab switching. Tab order: `{persona}` · Brief · Challenge · Questions · Convo.

**Done when:**
- Brief tab loads talking points from Haiku, cached after first call
- Challenge tab loads a hot take / steelman / paradox from Sonnet
- Questions tab loads 3 to 4 open questions from Haiku, cached
- Reroll on any deletes cache and gets fresh content
- Convo tab opens a chat with `{persona}` that streams responses
- Conversation history persists per topic

---

## Phase 5.5: Topic Groups + Level 2 cross-context

**Goal:** Implement Option 2 from the architecture decision. A topic can be a *group* that anchors sub-topic threads. Group-level Convo synthesizes across all child threads. See `docs/MEMORY.md` for the full cross-context model and pacing rules.

> [Live-state correction: `is_group` and `parent_topic_id` are no longer dormant. Entity groups shipped and are live (Red Rising, Corvids) with a drilldown UI and an umbrella check on every add. In 2.0 the placement resolver runs on every glint catch; see MAGPIE_2.md C.1.]

This phase brought the `is_group` and `parent_topic_id` columns on topics to life.

**Steps:**

1. Update `lib/queries/topics.ts` with `getGroupChildren(parentId)`, `getGroupSummary(groupId)`, and `getTopicWithGroup(id)`.
2. Update the Subject view to render group cards differently (slightly taller, shows child count and 3 child titles, expandable inline).
3. Build the Group detail view at `/topic/[id]` when `is_group = true`: shows child threads as cards, plus a group-level Convo that knows all children.
4. Update the Add Topic modal: when adding from inside a group, default the parent to that group. When the title looks like an entity, suggest "make this a group?"
5. Extend `buildConvoSystemPrompt` to accept sibling-thread context. Group Convo gets full child summaries; child Convo gets light sibling context.
6. **Critical: ship the pacing rules in `convoSystemPrompt` at the same time.** See `docs/MEMORY.md` for the principles. Cross-context without pacing is the failure mode.
7. Migrate the Red Rising sub-wiki: drop the `red rising` entity-anchor facet, convert those topics to children of a new Red Rising group topic in Books. Preserve all thoughts and conversations.

**Done when:**
- A topic can be marked as a group, and child topics can point to it via `parent_topic_id`
- The Subject view shows groups distinctly from flat topics
- Group-level Convo references all child threads naturally, governed by the pacing rules
- The Red Rising sub-wiki demos cleanly using the new structure
- Pacing rules are present in every Convo system prompt regardless of context level

---

## Phase 6: Facets navigation

**Goal:** User can browse by Facet across subjects.

**Steps:**

1. Build `app/(main)/facets/page.tsx`:
   - Server Component fetching `getFacetsWithCounts()`
   - Grid or list of facet cards with topic counts
2. Build `app/(main)/facet/[id]/page.tsx`:
   - App bar with back + facet name
   - List of all topics across all subjects with this facet
   - Each topic card shows its parent subject as a pill
3. Wire facet chips in Subject view to navigate properly (they currently filter within subject; that's fine; the Facets tab gives the cross-subject view).
4. Add facet chips to Add Topic modal (manual mode) so users can tag new topics on creation.

**Done when:**
- Facets tab shows a list of all user's facets with counts
- Tap a facet → see all topics with that facet, across subjects
- Add topic manual mode lets user pick or create facets

---

## Phase 7: Discover + Add Topic

**Goal:** Users can add topics via AI assist or manually, and the Discover queue works end-to-end.

**Steps:**

1. Build the Add Topic modal with two tabs: AI assist + Manual.
2. AI assist:
   - Textarea + mic for interests
   - `app/api/ai/extract/route.ts` server route calling Sonnet with Extract prompt
   - Checkbox list of extracted subjects/topics
   - Add button creates subjects (if new) and topics
3. Manual:
   - Title input + mic
   - Subject select (or create new)
   - Facet chips picker (multi-select)
   - Add button creates the topic
4. Build `app/(main)/discover/page.tsx`:
   - List of pending discover items
   - Skip and Accept buttons per item
   - "Ask Magpie for ideas" button that picks a random user topic and calls Related prompt, queues results
5. Build `app/api/ai/related/route.ts` (used by both topic detail and Discover).
6. Build the "If this hits, you'd dig" section in topic detail using `getRelated` query / API.

**Done when:**
- User can add topics via natural language and AI extracts them
- User can add a topic manually with title + subject + facets
- Discover queue accumulates from Organize and from "Ask Magpie"
- Adding from Discover puts the topic in a default subject ("Discoveries") or asks user to pick

---

## Phase 8: Settings + Polish

**Goal:** Settings work, journal exists, onboarding is smooth, mobile is tested.

**Steps:**

1. Build `app/(main)/settings/page.tsx`:
   - Persona name input + mic + save
   - AI suggestions toggle
   - Default mode select (persona / brief / challenge / convo)
   - Reset to seed (destructive with confirm)
   - Sign out
2. Build `app/(main)/journal/page.tsx`:
   - List of topics with thoughts, each showing first 6 bullets
   - Tap a topic to jump to it
   - [Superseded: the Journal surface was replaced by the Nest. In 2.0 its thoughts view folds into the Library (Maggie as librarian), pull-based; see MAGPIE_2.md C.4. The underlying query survives.]
3. Build onboarding:
   - Post-signup screen: "What are you into?" textarea with mic
   - Or "Skip and use starter pack" button
   - On submit: AI extract, confirm checkboxes, seed
4. Mobile QA pass:
   - Test every screen at 375px
   - Touch targets >= 44px
   - Bottom tab bar accounts for safe-area-inset-bottom
   - Modal slide-in animations feel right
5. Performance pass:
   - Lazy-load shadcn components where possible
   - Make sure Server Components are doing the heavy lifting
   - Add suspense boundaries for AI calls

**Done when:**
- All settings persist correctly
- Renaming persona updates every tab label, placeholder, header in real time
- Journal shows captured thoughts across topics
- Onboarding flow is smooth for a new user
- App is usable on a phone in one hand

---

## Phase 9: Deploy

**Goal:** Magpie is live at magpie.wiki.

**Steps:**

1. Push to GitHub (private repo `dogsleddev/magpie`).
2. Connect to Vercel:
   - Project: magpie
   - Framework: Next.js
   - Environment variables: copy from `.env.local`
3. Configure custom domain magpie.wiki in Vercel.
4. Update DNS at your registrar.
5. Verify HTTPS, magic links work in production (Supabase auth URLs must include the production domain).
6. Add Vercel Analytics or Plausible.
7. Add Sentry for error monitoring.
8. Write a one-pager `README.md` for the public-facing GitHub if you want.

**Done when:**
- magpie.wiki resolves to the production app
- A fresh user can sign up and use all features end-to-end
- Errors are captured in Sentry
- Analytics are reporting page views

---

## Phase 9.5: Desktop responsive layout (the full pass)

**Goal:** Magpie graduates from "great on phones, decent on laptops" to "great on both." Full spec in `docs/RESPONSIVE.md`.

The 10-hour prototype shipped a minimal desktop layout (left rail + reading widths). This phase brings the full two-pane experience.

**Steps:**

1. Build the left rail component to replace the bottom tab bar at >=1280px widths. Vertical navigation (Grid, Facets, Discover, Journal, Glints), magpie mark at top, profile menu at bottom, Add Topic + Convo Roulette as quick actions in the middle.
2. Build the two-pane Subject view: left rail + subject's topic list (320px column) + topic detail (flex). Tapping a topic opens it inline without navigation.
3. Build the two-pane Topic view: left rail + topic content (center) + meta rail (280-320px right column showing facets, related, glints).
4. Apply reading-width constraints (`max-width: 720px; margin-inline: auto;`) to all text-heavy modes (Brief, Challenge, Questions, Convo content). Already partial from prototype, finish it here.
5. Tablet breakpoint (768-1280px): graceful in-between. Bottom tab bar becomes left rail where it fits, content stays single column but with generous side margins.
6. Hover affordances on facet chips, related items, glint cards. Tooltips where they help.
7. QA at all breakpoints listed in RESPONSIVE.md.

**Done when:**
- A visitor lands on magpie.wiki at 1440px and the first feeling is calm, not "phone in middle of screen"
- Reading any AI mode feels like reading a thoughtful column
- Navigation is always one click away
- All breakpoints from 375px to 1920px are intentional, not stretched

---

## Phase 10: Glints (the surfacing surface)

> [Terminology moved: in 2.0 the word "glint" is the daily capture (catch a small curiosity in about 30 seconds, keep a streak). This older inward-surfacing feature is renamed the "resurfacing engine" and now lives inside the Library, pull-based; see MAGPIE_2.md C.4 and D (Phase 3). Read every "Glints" below as that resurfacing engine, not the daily catch.]

**Goal:** Maggie surfaces things from the user's own wiki that connect to what they are currently working on. Glints is the *inward* counterpart to Discover (which proposes new things to add). See `docs/FUTURE_FEATURES.md` for the full Glints spec, three-surface design, and copy patterns.

This phase depends on Level 3 cross-context (facet-overlap query) being in place. Level 4 (embeddings) makes Glints sharper, but Level 3 is enough to ship.

**Steps:**

1. Build `lib/queries/topics.ts` `getGlintsForUser(userId, currentTopicId?)` that returns 3 to 8 topics from the user's wiki that connect to the current topic (via facets at v1, embeddings at v1.5).
2. Build the home grid Glints section: section header, 3 visible cards, "see all" tail. Each card is a tappable row that opens the existing topic. No Add/Skip buttons. Why-line copy points at past-user activity: "you wrote about this when..."
3. Build the topic detail Glints card: appears near the bottom of the topic page when relevant glints exist. Same visual treatment.
4. Build inline-in-Convo Glints surfacing: governed by the pacing rules from `docs/MEMORY.md`. Single bridge at natural pauses, never a tour.
5. Add a Glints toggle in Settings: controls inline-in-Convo behavior only. Home and topic-page surfaces always stay accessible.
6. Build `/glints` route for the "see all" tail (full list view of all current glints).

**Done when:**
- The home grid shows a Glints section with 3 visible cards plus "see all"
- The topic detail page surfaces relevant glints as a card near the bottom
- Maggie weaves single, well-paced bridges in Convo when glints earn it
- The Settings toggle disables inline-in-Convo glints without affecting other surfaces
- The copy distinction between Discover and Glints is clear in use: Discover proposes new, Glints revisits existing

---

## Phase 11: Nest View (the constellation)

**Goal:** A force-directed graph visualization of the user's wiki, with the connections Maggie has drawn between topics shown as lines between nodes. Nest View is the *visual* read of the same cross-context engine that powers Glints.

Sequenced after Glints because both depend on having real cross-topic connections to display. On desktop, Nest View becomes a centerpiece feature. On mobile, it lives inside the Facets tab as a tap-into surface, not a primary navigation.

A working visual reference for this view already exists in the bootstrap at `docs/magpie-v1-reference.html`. Open in browser to see the target.

**Steps:**

1. Install d3 (`d3-force` specifically) or react-force-graph. Decide based on bundle size and customizability.
2. Build the data shape: nodes (subjects + topics, sized by importance/recency), edges (cross-subject links from shared facets, embeddings, or Maggie-noted bridges).
3. Build the canvas at `/nest`: full-screen on desktop, sheet-style overlay on mobile.
4. Add a small Nest View card inside the Facets tab as an entry point, replacing the dimmed preview tile from v1.
5. Style the visualization with the plumage palette: nodes in off-white, subject nodes larger and brighter, cross-subject links in teal, AI-suggested-but-not-yet-added nodes with a dashed outline (per the v1 reference).
6. Interactions: hover a node to see the title, tap to open the topic, drag to rearrange. On desktop, the right rail shows the highlighted node's neighborhood.
7. Performance: cap nodes shown at once (~50-80) to keep the graph readable. Filter or zoom-cluster larger wikis.

**Done when:**
- The user's wiki renders as a navigable constellation
- Cross-subject connections are visible and labeled
- Tapping a node opens the topic
- The view is genuinely beautiful on desktop and usable on mobile

---

## Phase 12 (post-MVP, flagship): Draw Out mode

**Goal:** A practice mode where the user makes an AI character shine, and gets scored on conversational generosity. This is the differentiator. Full spec in `docs/CHARISMA.md`.

This slots in after the desktop responsive layout (Phase 10) and demo mode, alongside or just before the social layer. It deserves a focused build, not a rushed bolt-on.

**Steps:**

1. Build `app/api/ai/drawout/character/route.ts`: calls Sonnet with `drawOutCharacterPrompt`, returns a character (parse JSON to `DrawOutCharacter`). Cache the character per session.
2. Build `app/api/ai/drawout/chat/route.ts`: streaming endpoint like Convo, but uses `drawOutRolePlaySystemPrompt(character)`. Stores transcript with `kind = 'drawout'`.
3. Build `app/api/ai/drawout/score/route.ts`: calls Sonnet with `drawOutScoringPrompt`, returns the `DrawOutScore` report card.
4. Apply schema additions from `docs/CHARISMA.md`: `conversations.kind` column, optional `drawout_scores` table.
5. Build the Draw Out entry point. Leaning toward a dedicated top-level activity rather than a per-topic tab, since drawing out a character is a distinct activity from solo riffing. Confirm during build.
6. Build the role-play chat UI (reuse Convo's streaming components).
7. Build the end-of-session score report card (slides up, honest and specific, quotes real moments).
8. Optional: a subtle "warmth meter" showing how open the character currently is. Prototype and feel it out; cut if cheesy.

**Done when:**
- User can start a Draw Out session and get a character with a hidden gem
- The character stays guarded and opens up only to good questions
- Ending the session produces an honest, specific score report on conversational generosity
- The transcript and score persist

---

## Backlog (post-launch)

- Topic sharing via link
- Export to Markdown / Notion
- Voice-first mode (Maggie speaks back)
- iOS app via Expo or PWA install prompts
- Multi-language support
- Public curator profiles
- Recurring Draw Out characters that open up more over many sessions
- Scoring real (consented) conversation transcripts against the charisma rubric
- "The Parliament": a full named social/charisma track if Draw Out lands
- Personalized Surfacing (cross-media): once Glints and Nest View are mature, the same engine can surface new things from outside the wiki (books, films, articles, podcasts, technologies) that fit the pattern of what the user has been pulling on. Strict principles apply: no ads, no affiliates, no kickbacks, pull-not-push, Maggie's voice, cross-media from day one, diversity over relevance. See `docs/FUTURE_FEATURES.md` for the full principles section.
