# Magpie · Handoff to a New Session

_Updated 2026-07-11. **Slice-0 of the glint-first 2.0 pivot is BUILT, verified end to end, and deployed to a preview.** It lives on branch `feat/magpie-2`. The current phase is **dogfooding** (catch a glint daily for ~2 weeks; nothing new builds until the loop proves it is fun). `master` is a clean trunk now (the krava/linq removal deployed). Read top to bottom before doing anything._

---

## TL;DR (30-second briefing)

You are picking up **Magpie**, a personal conversation gym at **magpie.wiki**. Founder: **Chris Dougherty** (dogsled.dev, GitHub `dogsleddev`). Windows 11 + PowerShell. Repo: **`C:\dev\magpie`** (never the old OneDrive path).

**Magpie is pivoting to 2.0, glint-first.** The daily loop: catch a glint (a small curiosity, one 1-to-3 word record), Maggie shows connection chips to what you already collect, and catching one keeps your streak. **Slice-0 (that loop, no auth, on the shared account) is built and working.** The heavier stuff (per-user auth, item controls, the Library, communities, the daily email/text trigger) comes after the loop is dogfood-proven. **`docs/MAGPIE_2.md` is the canonical spec.**

**Read in this order:**

1. **This file**, then the "Where we are" section below.
2. **`CLAUDE.md`** (the North Star; it has a 2.0 banner up top).
3. **`docs/MAGPIE_2.md`** (the canonical 2.0 product model, schema, staged roadmap).
4. **`docs/BRD.md`** (the PRD) and **`docs/SOP.md`** (the build plan: Slice-0, then phases).
5. Skim `docs/COMPETITORS.md`, `docs/MESSAGING.md` + `docs/MICROCOPY.md` (locked copy), `docs/BRAND.md` (voice), `docs/NEST.md`, `docs/FUTURE_FEATURES.md`.

---

## Where we are (session end, 2026-07-11): read this to pick up

**Check out `feat/magpie-2`. That is where 2.0 lives** (both the pivot docs and Slice-0). `master` has the krava/linq removal but NONE of the pivot; do not work from it.

**What shipped this session:**
- **`master` is a clean, current trunk.** The `chore/remove-krava-linq` branch (krava/linq removal + QC hardening + rate limiting + migrations 0002 to 0007) was fast-forward merged to `master` and **deployed to prod** (verified: `magpie.wiki/krava` and `/linq` now 404). The live app is still the pre-pivot experience; the pivot is not on master yet.
- **The 2.0 pivot docs are written and aligned** (on `feat/magpie-2`): `docs/MAGPIE_2.md` (new, canonical), revised `docs/BRD.md` / `docs/SOP.md`, and every reference doc got a 2.0 banner (`CLAUDE.md`, `PRODUCT.md`, `SCHEMA.md`, `NEST.md`, `STATUS.md`, `FUTURE_FEATURES.md`, etc.).
- **The connection engine is validated.** `scripts/connection-spike.mjs` proved Haiku semantic matching produces genuinely good "connects to X" chips on the real 171-topic graph (keyword matching was too brittle; embeddings are only a later scale optimization).
- **Migration `0008_slice0.sql` is APPLIED to prod** (additive: `user_settings.timezone`, `topics.brief_seed` + `raw_input`, `activity_days`, `usage_events`). Verified with `scripts/db/verify-0008.mjs`.
- **Slice-0 is built, type-checked, and verified in the browser** end to end: catch a glint (optimistic, instant), it gets a 1-to-3 word name, 2 Haiku connection chips land a beat later linked to real topics, and the streak increments once per local day. `/home` is the entry (wordmark + login both land there), with an activity strip.

**`feat/magpie-2` commits (all pushed to origin):**
- `59b0bce` slice-0 start (connection spike + the additive migration)
- `a021915` the capture flow
- `e89d426` 1-to-3 word glint names
- `3a385d7` `/home` as the entry + the activity strip
- (plus `27fe123` the pivot docs, under those)

**The dogfood preview:** `https://magpie-git-feat-magpie-2-dogsled.vercel.app/home` (Chris uses this daily). It has Vercel Deployment Protection on (Chris passes it because he owns the project). Glints land on the shared account, which is the plan.

**The Slice-0 build map (what exists now):**
- `lib/actions/glints.ts`: `captureGlint` (reuses `addTopicViaMagpie` to file the curiosity, derives the short title for >3-word glints, sets `raw_input`/`brief_seed`, runs connections, marks the streak, logs the event).
- `lib/ai/connections.ts`: `findConnections`. `lib/ai/prompts.ts`: `connectionsPrompt` + `shortTitlePrompt`.
- `lib/queries/activity.ts`: `getUserTimezone`, `markTodayActive`, `getStreak`, `getActivityStrip`. `lib/queries/usage.ts`: `logEvent`. `lib/queries/topics.ts`: `setGlintSeed` added.
- `app/(main)/home/page.tsx`, `components/home/glint-capture.tsx` (optimistic client capture), `components/home/activity-strip.tsx`.
- `components/nav/app-bar.tsx` (wordmark → `/home`), `lib/actions/demo-login.ts` (default redirect → `/home`).

**Known small gaps (not blockers; post-dogfood):**
- The Nest still labels nodes with full titles; the new short glint names want the short-label update (`docs/NEST.md`, C.11).
- The activity strip's live-refresh-after-catch relies on the standard `revalidatePath('/home')`; confirmed rendering, not separately confirmed refreshing mid-session.
- The glint's connection chips show the "why" only as a hover tooltip (no hover on mobile); consider showing it inline or on tap.

**The dogfood gate:** catch a glint daily for ~2 weeks. The one question: does it make you want to open it tomorrow? `usage_events` logs `glint_caught` so D7 return is measurable. If yes, the loop earned Phase 1 (`docs/SOP.md`). If not, rethink the loop before building more.

**Immediate next candidates (after / alongside dogfood):** the Nest short-labels; then Phase 1 (per-user auth + the public read view + the daily email/text trigger, which is what actually pulls people back).

---

## How to talk to Chris (read twice)

**Voice in working sessions:** high-energy surfer-bro casual ("brudha," "stoked," "rad"). Match it for technical work and banter. Shift to a refined editorial register for finished copy, anything client-facing, or anything touching his co-founder Jessica / fastinsights.io.

**AI tells Chris hates:**

- **Em dashes. Zero, ever.** Use periods, commas, parentheses, colons. Even one in a deliverable gets noticed.
- **"actually"** as a defensive qualifier. Cut it.
- Marketing-shaped words: "unlock," "amazing," "supercharge," "AI-powered," "seamless," "next-level," "discover insights."
- Excessive hedging. Direct opinions land harder.

**Chris likes:** direct opinions with reasoning ("My pick: A, here's why"), concrete over abstract ("5 minutes" not "a few minutes"), engineer-first detail when relevant, options over one default when naming, honest pushback when he is wrong, diagrams and mockups to align before coding. He moves fast and delegates ("go with your recommendations"): make a clear pick and execute, keeping prod-affecting actions gated on his explicit go.

**Avoid:** sycophancy / "Great question," over-explaining before acting, asking permission for trivial things, making up facts (search or ask instead).

**Coordinate before irreversible/outward moves** (pushing to `master` auto-deploys to prod; he runs Supabase/Vercel/DNS dashboard actions, you drive the code and git). Applying DB migrations is his dashboard job (see env note below).

---

## Terminology (settled)

- **Glint** = the catch and the streak unit. "Catch a glint." A glint IS a curiosity.
- **Curiosity** = the user-facing collection word (homepage, in-app). Hero line stays _Collect curiosities. Talk them through._
- **Topic** = the internal / code entity (the `topics` table). Same record. No code-wide rename.
- **Persona = Maggie. Brand / product / domain = Magpie.**

---

## The 2.0 direction (locked decisions)

Full detail in `docs/MAGPIE_2.md` and `docs/BRD.md`. Glint-first, after a hard adversarial critique.

1. **The glint is the daily habit and the streak.** Catch at least one per day (about 30 seconds), keeps the streak. 7-day recovery. "Today" is the user's timezone, PST if unknown.
2. **A glint is a curiosity is a topic.** No separate glints store; it enters the graph and connects for free.
3. **Connections fire at capture,** from a Haiku semantic match (spike-validated). Optimistic capture; chips a beat later.
4. **No Daily Review feature.** "Review" is just Maggie resurfacing past glints in the Library (pull-based, optional, never a gate).
5. **The trigger is an opt-in daily email or text** (Phase 1; the real retention mechanism, email via Resend first, SMS later).
6. **A totally public read view** (browse everything, no signup, no dashboard). **Home** is the gated personal dashboard behind the wordmark and the post-login landing. **Library replaces Rediscover.**
7. **Facets become a controlled vocabulary** (max 50 system-wide, 20 per user).
8. **Communities, three kinds:** the public read view; shared-account communities (Gemini-style, dashboard/settings admin-gated); individual-share nests (later). The 171-topic account becomes the flagship public community nest.
9. **Accessibility Settings** (font choice incl. a dyslexia-friendly option; theme System/Light/Dark, default Dark). **Voice = server-side STT** (iOS Web Speech is dead), post-structural.
10. **Nest: short-name labels + a 2D/3D toggle** (2D stays default; 3D is Chris's parallel Fable track over the same `build-graph.ts`).
11. **Deferred (cut from early slices, not deleted):** the Maggie tab merge, item controls (binary favorite first, 1-to-10 later), adaptive-temperature behavior (columns captured early), the AI interest-picker (use the starter pack), community share.

---

## Env and tooling realities (learned this session)

- **`.env.local` has** `NEXT_PUBLIC_SUPABASE_URL` + `_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `ANTHROPIC_API_KEY`. It does **NOT** have `SUPABASE_DB_PASSWORD`, and `DEMO_LOGIN_PASSWORD` is empty.
- **You cannot apply DDL migrations from here** (no DB password; the service-role key only reaches the PostgREST data API, not `CREATE`/`ALTER TABLE`). **Chris runs migrations in the Supabase SQL editor** (`main / PRODUCTION`, Role postgres). Write the SQL, hand him the paste-able block, then verify with a read-only script via the service-role key (pattern: `scripts/db/verify-0008.mjs`).
- **Local login works** via the passwordless service-role path in `lib/actions/demo-login.ts` (no `DEMO_LOGIN_PASSWORD` needed).
- **Read scripts run with** `node --env-file=.env.local scripts/...mjs` and the service-role key (see `scripts/connection-spike.mjs`, `scripts/db/verify-0008.mjs`). NOTE: a bare `node -e` without `--env-file` will not see `.env.local`.
- **The generated Supabase types (`lib/supabase/types.ts`) do NOT include the 0008 tables/columns** (`activity_days`, `usage_events`, `brief_seed`, `raw_input`, `timezone`). The new query functions use a narrow `as unknown as { from }` cast with a comment. Regenerate types once a DB connection is available and drop the casts.
- **Vercel MCP (`vercel-chris`) needs an auth step** that a non-interactive session cannot do; verify deploys over HTTP (curl) instead. `gh-chris` did not connect; use plain `git`.

---

## Stack and ops

- Next.js 15 (App Router, TS strict), Supabase (Postgres + RLS + Auth + Storage), Anthropic (Sonnet 4.5 `claude-sonnet-4-5-20250929`, Haiku 4.5 `claude-haiku-4-5-20251001`), Vercel, Tailwind + shadcn/ui.
- `lib/queries/` is the single source of truth (UI + AI share it).
- **Repo:** `github.com/dogsleddev/magpie` (public). Push to `master` auto-deploys to magpie.wiki. **2.0 lives on `feat/magpie-2`** (pushed to origin, its own Vercel preview). Merge to master only when a slice is proven and Chris green-lights the deploy.
- Migration files: `master` is at 0007; `feat/magpie-2` adds `0008_slice0.sql` (applied to prod already).

---

## Hard rules (do not violate)

- **No em dashes** anywhere (code, comments, copy, commits). Sweep new docs with a grep for the em and en dash characters before committing.
- **Do not invent taglines or microcopy.** Use `MESSAGING.md` / `MICROCOPY.md`. New features ship with the feature name only. The one locked hero line stays _Collect curiosities. Talk them through._
- **Clear `.next` before any build or dev** (`Remove-Item -Recurse -Force .next`).
- **RLS everywhere.** No service-role key in the client. Every new table gets the four-policy `auth.uid() = user_id` pattern; join tables gate through the parent. The deliberate exceptions (public-read on showcase content, a `SECURITY DEFINER` community-join, global rank) never weaken table RLS.
- **No Anthropic SDK in the client.** All model calls go through server routes / server actions.
- **Mobile-first at 375px.** Verify before calling anything done: `npm run type-check`, clean `npm run build`, and exercise the real flow in the browser. Coordinate before pushing to master.

---

## Security precondition (Phase 1, not Slice-0)

Slice-0 runs on the shared account and needs none of this. Phase 1 (per-user auth) does: **[Chris]** rotates the `dogsled@dogsled.dev` app password and the `SUPABASE_DB_PASSWORD` (both in public git history), stands up SMTP, and fixes the `www`/apex callback allow-list, before the default entry flips from demo-login to signup. Steps: `docs/SOP.md` section 2 (and the untracked, local-only `qc-audit/OWNER_ACTIONS.md` section 1). Non-breaking; nothing running depends on those values.

---

## Open decisions (for Chris)

Recommendations are in `docs/MAGPIE_2.md` section E and `docs/BRD.md` section 11. Mostly settled now (glint-first, per-user accounts, the trigger, facet caps, communities, pricing free-now). The ones still wanting his explicit call: the one dogfood metric (recommended D7 return), the facet-cap read (recommended 20 per user), shared-account community dashboard behavior, email-vs-SMS trigger order, and when global streak rank turns on.

🪶
