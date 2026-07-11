# Magpie · Handoff to a New Session

_Updated 2026-07-10. **Magpie is pivoting to 2.0, glint-first:** catch a small shiny curiosity in about 30 seconds, watch Maggie connect it to what you already collect, and keep a daily streak. A hard adversarial critique reshaped the plan to ship the glint loop first (Slice-0, no auth) before building auth or the rest. The LinkedIn launch is parked. The full 2.0 model is `docs/MAGPIE_2.md`. Read top to bottom before doing anything._

---

## TL;DR (30-second briefing)

You are picking up **Magpie**, a personal conversation gym at **magpie.wiki**. Founder: **Chris Dougherty** (dogsled.dev, GitHub `dogsleddev`). Windows 11 + PowerShell. Repo: **`C:\dev\magpie`** (never the old OneDrive path).

**The app is BUILT and LIVE** as a shared-account community (one-click "Enter Magpie"). It has the five modes, the Nest constellation, entity groups, Add Topic, Facets, search, and Recent Ideas.

**The current work is Magpie 2.0**, glint-first. The daily loop: catch a glint (a curiosity, one 1-to-3-word record), Maggie shows connection chips, catching one keeps your streak (7-day recovery, timezone-aware), and an opt-in daily email/text pulls you back. A public read view lets anyone browse without signup; the personal dashboard is gated. Everything heavier (per-user auth, item controls, the Library, adaptive temperature, communities) comes after the loop is proven by dogfooding. **`docs/MAGPIE_2.md` is the canonical spec.**

**Read in this order:**

1. **`CLAUDE.md`** (the North Star; its "Current status" section is what is live) ← start here
2. **`docs/BRD.md`** (the PRD, revised to 2.0: vision, requirements, metrics, decisions)
3. **`docs/MAGPIE_2.md`** (the canonical 2.0 product model, schema, and staged roadmap)
4. **`docs/SOP.md`** (the build plan: Slice-0 first, then phases, who does what)
5. **`PROGRESS.md`** (build log; the START HERE block has the open bugs + backlog)
6. Skim `docs/COMPETITORS.md` (positioning), `docs/MESSAGING.md` + `docs/MICROCOPY.md` (locked copy), `docs/BRAND.md` (voice), `docs/NEST.md`, `docs/FUTURE_FEATURES.md`

---

## How to talk to Chris (read twice)

**Voice in working sessions:** high-energy surfer-bro casual ("brudha," "stoked," "rad"). Match it for technical work and banter. Shift to a refined editorial register for finished copy, anything client-facing, or anything touching his co-founder Jessica / fastinsights.io.

**AI tells Chris hates:**

- **Em dashes. Zero, ever.** Use periods, commas, parentheses, colons. Even one in a deliverable gets noticed.
- **"actually"** as a defensive qualifier. Cut it.
- Marketing-shaped words: "unlock," "amazing," "supercharge," "AI-powered," "seamless," "next-level," "discover insights."
- Excessive hedging. Direct opinions land harder.

**Chris likes:** direct opinions with reasoning ("My pick: A, here's why"), concrete over abstract ("5 minutes" not "a few minutes"), engineer-first detail when relevant, options over one default when naming, honest pushback when he is wrong, diagrams and mockups to align before coding.

**Avoid:** sycophancy / "Great question," over-explaining before acting, asking permission for trivial things, making up facts (search or ask instead).

**Coordinate before irreversible/outward moves** (pushes auto-deploy to prod; he does dashboard clicks for Supabase/Vercel/DNS, you drive the code).

---

## What Magpie is

A **conversation gym**. Hero line: _Collect curiosities. Talk them through._ You build a wiki of what you find interesting and talk it out loud in 3-to-5-minute reps with a persona who remembers. **2.0 adds the memory:** the best of what you say comes back on a spaced schedule. Four verbs: **Collect. Talk. Save the best. Review.**

- **Three dimensions:** Subject × Topic × Facet.
- **Persona = Maggie. Brand / product / domain = Magpie.** (Locked.)

---

## Current state (live today, pre-pivot)

- **https://magpie.wiki**, a **shared-account community**: everyone enters via one-click **"Enter Magpie"** (`dogsled@dogsled.dev`) and grows one shared grid + Nest.
- **Live nav:** bottom bar is Grid / Facets / Nest / Rediscover; the wordmark links to the Grid (`/app`).
- **Live topic tabs:** the persona-named tab renders Maggie's chat and is the default; then Brief, Challenge, Questions; the last tab is Thoughts (bullet capture). Component names are legacy (`ConvoMode` is the chat, `PersonaMode` is the capture).
- **Shipped:** the Nest mind map (`/nest`, full-bleed on every viewport), entity groups with a drilldown UI (Red Rising, Corvids; umbrella check on every Add Topic), Add Topic with auto-filed subject + facets + grouping, Rediscover (random topic), search (`/search`), Recent Ideas + inline editing (`/recent`), Facets nav (`/facets`), Maggie's per-topic AI opener, quiet delete-topic, mic-to-text, Organize.
- **RLS is already per-user** on every table; the shared login just pools all signal under one `auth.uid()`. So 2.0 activates per-user **authentication**, it does not "turn on RLS."
- **Krava and Linq are being removed** (branch `chore/remove-krava-linq`). Out of the 2.0 stack.
- **Open / caveats:** per-user signup is NOT wired (no SMTP, plus a `www` vs apex callback allow-list gap in `PROGRESS.md`); iOS mic is a WebKit dead stub (keyboard-dictation hint shipped, unverified on-device); repo is public and the demo-account + DB passwords in git history need rotating before real signups (see below).

---

## The 2.0 direction (the current work)

Full detail in `docs/MAGPIE_2.md` and `docs/BRD.md`. It is **glint-first** after a hard adversarial critique (2026-07-10). Chris's locked decisions:

1. **The pivot is the focus, and it ships glint-first.** The daily habit is the glint, not a spaced-repetition review. Prove the loop on the shared account (Slice-0, no auth) before building auth or anything else.
2. **Terminology: glint / curiosity / topic, one record.** A **glint** is the catch and the streak unit; a **curiosity** is what it becomes (user-facing, on the homepage); a **topic** is the code entity. No code-wide rename.
3. **The glint is the daily habit and the streak.** Catch at least one glint (curiosity) per day, about 30 seconds, keeps the streak. 7-day recovery. "Today" is the user's timezone, or PST if unknown.
4. **A glint is a curiosity is a topic.** Catching a glint = adding a curiosity. No separate glints table; it enters the graph and connects for free.
5. **Connections fire at capture.** On catch, Maggie shows 2-3 tappable "connects to X" chips from a Haiku semantic match (spike-validated against the real 171-topic graph, `scripts/connection-spike.mjs`; keyword matching was too brittle). Capture is optimistic (saves instantly, chips animate in a beat later). Embeddings are only a later scale optimization.
6. **The trigger is an opt-in daily email or text** (~7am local). Magpie has none today; it is what actually brings users back, and lands with accounts (email first via Resend, SMS later via Twilio).
7. **A totally public read view.** Anyone browses the Grid, curiosities, Facets, Nest (the showcase) without signup; they never see a dashboard. Auth gates only the personal Home and private capture.
8. **Home is the gated personal dashboard** behind the wordmark (your streak, glints, stats), the post-login landing. **Library replaces Rediscover** in the lower-right.
9. **Facets become a controlled vocabulary:** max 50 system-wide (curated later), 20 per user. Makes connections reliable.
10. **Communities, three kinds:** the public read view; shared-account communities (Gemini-style, dashboard/settings admin-gated); individual-share nests (later). The 168-topic account becomes the flagship public community nest (preserves demo density, seeds new users).
11. **Accessibility Settings:** font choice (incl. a dyslexia-friendly option like OpenDyslexic) and theme (System / Light / Dark, default Dark).
12. **Voice, server-side STT** (iOS Web Speech is dead), the priority right after the core structural work.
13. **Nest: short-name labels + a 2D/3D toggle** (2D stays default; 3D is a parallel track Chris builds with Fable, over the same `build-graph.ts`).
14. **No Daily Review feature.** The only daily thing is the glint. "Review" is just what Maggie does when she resurfaces past glints in the Library (pull-based, optional, never a gate). **Deferred (cut from early slices, not deleted):** any spaced-repetition ordering of that resurfacing, the Maggie tab merge, item controls with a binary favorite first (1-to-10 later), adaptive temperature behavior (columns captured early), the AI interest-picker (use the starter pack), community share.

**The load-bearing build facts:** timezone must be stored before any dated table (the streak has no correct "today" otherwise); a glint is a topic, so capture is the existing add-a-topic path made fast and optimistic; and when item controls land, `response_items` needs a `generation_id`/`is_current` marker or reroll silently drops favorited text. Build order and ownership: `docs/SOP.md`.

---

## Security precondition (Phase 1, not Slice-0)

Slice-0 runs on the shared account and needs none of this. Phase 1 (per-user auth) does: **[Chris]** rotates the `dogsled@dogsled.dev` app password and the `SUPABASE_DB_PASSWORD` (both in public git history), stands up SMTP, and fixes the `www`/apex callback allow-list, before the default entry flips from demo-login to signup. Steps: `docs/SOP.md` section 2 (and the untracked, local-only `qc-audit/OWNER_ACTIONS.md` section 1). Non-breaking; nothing running depends on those values.

---

## Stack and ops

- Next.js 15 (App Router, TS strict), Supabase (Postgres + RLS + Auth + Storage), Anthropic (Sonnet 4.5 `claude-sonnet-4-5-20250929`, Haiku 4.5 `claude-haiku-4-5-20251001`), Vercel, Tailwind + shadcn/ui.
- `lib/queries/` is the single source of truth (UI + AI + any future API share it). Slice-0 adds `activity_days` + `usage_events` and `user_settings.timezone`; later phases add `response-items.ts`, `library.ts`, `stats.ts`, and the facet-vocabulary and community modules. New infra in 2.0: Resend + Vercel Cron (daily trigger), a transcription API (server-side voice), pgvector (embeddings, Phase 3).
- **Connectors:** `vercel-chris` (Vercel MCP, `dogsled` team) drives and verifies deploys. `.mcp.json` is gitignored. `gh-chris` did not connect; use plain `git`.
- **Repo:** `github.com/dogsleddev/magpie` (public). Push to `master` auto-deploys to magpie.wiki. **2.0 lives on a WIP branch** until its NOW slice is coherent (master keeps prod live meanwhile).

---

## Hard rules (do not violate)

- **No em dashes** anywhere (code, comments, copy, commits).
- **Do not invent taglines or microcopy.** Use `MESSAGING.md` / `MICROCOPY.md`. New features without a locked tagline ship with the feature name only. The one locked hero line stays _Collect curiosities. Talk them through._
- **Clear `.next` before any build or dev** (`Remove-Item -Recurse -Force .next`).
- **RLS everywhere.** No service-role key in the client. Every new 2.0 table gets the four-policy `auth.uid() = user_id` pattern; join tables gate through the parent row. The one deliberate future exception (global streak rank) uses a narrow `SECURITY DEFINER` function, never weakened table RLS.
- **No Anthropic SDK in the client.** All model calls go through `app/api/ai/*`.
- **Mobile-first at 375px.** Every new 2.0 surface designed on the phone first.
- **Verify before calling anything done:** `npm run type-check`, clean `npm run build`, exercise it. Coordinate before pushing (prod auto-deploys).

---

## Open decisions (for Chris)

Recommendations are in `docs/MAGPIE_2.md` section E and `docs/BRD.md` section 11. Settled in batch 2: pricing (free now, paid later), favorite semantics (a light save with 1-to-10 intensity), and community share (in scope, highlight-grain, invite-by-link nests). The ones that most want his explicit call: whether the Daily Glint feeds the streak or keeps its own record, the Daily Review composition + spaced-repetition intervals, tagging model (highlight tags + colors vs facets), community-nest roles + when the full infra ships, and when global streak rank turns on.

🪶
