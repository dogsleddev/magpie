# Magpie · Handoff to a New Session

_Updated 2026-07-11 (session end). **The entity-spine redesign is BUILT through Slice 3** on branch `feat/magpie-2` (all pushed, preview-only). The daily loop is real end to end: catch a glint in your words, correct or split its entities, watch it connect honestly through a shared hub, and browse it all in the Library and the Nest. Only Slice 4 (the Maggie tab-merge) remains. `master` is still the pre-pivot app. Read top to bottom, then the "What to do next" section drives the session._

_Update 2026-07-12: seven commits on top (`eb75165` .. `4a1dabd`), committed but NOT pushed (a push rebuilds the preview, gated on Chris). Done: the no-gate audit cleanups (Library revalidation, honest Nest error handling, the `+ add` reuse typeahead, the §3.7 spec fix), the "see as nest" reverse jump (verified in-browser), and `scripts/merge-entities.mjs`. **Two investigations changed the plan (see picks 3 and 5): the 36-topic backfill hole is already closed (1 left), and there are ~no clean dupes to merge (the audit's dupes are actually nesting pairs). Do not run a merge or backfill `--write`.** The real noise was auto-nesting zero-glint hubs (§6.5), now addressed by a hybrid propose-not-automatic prototype (`4a1dabd`, awaiting Chris's flip; see the §6.5 flag below). Slice 4 plus the Chris-gated preconditions (security rotation, DB snapshot) remain the open front. Completed items carry `[DONE 2026-07-12]` markers below._

---

## TL;DR (30-second briefing)

You are picking up **Magpie**, a personal conversation gym at **magpie.wiki**. Founder: **Chris Dougherty** (dogsled.dev, GitHub `dogsleddev`). Windows 11 + PowerShell. Repo: **`C:\dev\magpie`** (never the old OneDrive path).

**Magpie 2.0 is glint-first, and it is now entity-spined.** A glint is a curiosity in the user's own words. Maggie extracts the **entities** it is about (wolves, Yellowstone), which are many-to-many **rollup hubs** that connect glints across subjects and nest into broader hubs. This turns a fuzzy connection into an honest join ("both about wolves"), and it is the backbone of the Library and the Nest.

**Read in this order:** this file, then `docs/REDESIGN.md` (the canonical redesign spec: model, schema, the phased slices, the open decisions), then `docs/MAGPIE_2.md` (the 2.0 product model) and `CLAUDE.md` (the North Star). `docs/SOP.md` §2 has the security precondition.

**Work on `feat/magpie-2`.** `master` has none of the pivot.

---

## Where we are (session end, 2026-07-11)

**This session shipped Slices 1 to 3 of the entity-spine redesign (12 commits, `23f604f` to `7b7bafe`, all pushed):**

- **Dogfood polish + entry:** connection "why" now shows inline on mobile, the streak ticks up optimistically, a **Today** tab is in the bottom nav, sign-in lands on `/home`, and the stale Gemini landing section is gone.
- **Capture:** glints keep the user's words (no more Title-Case rename), re-catching an existing glint opens it instead of making a twin, and connections run faster.
- **The redesign spec + migration:** `docs/REDESIGN.md` (synthesized by a design pass, with mockups published as a Claude artifact) and `supabase/migrations/0009_entities.sql` (**applied to prod**: four tables `entities` / `topic_entities` / `entity_parents` / `entity_aliases`, RLS in the house style).
- **Slice 1, the entity spine:** entity extraction folded into `categorizeTopicPrompt` (one call), `lib/queries/entities.ts` (the data layer), honest shared-hub connections with a fuzzy fallback, a backfill (`scripts/backfill-entities.mjs`) that seeded ~285 entities over the graph, editable capture chips (x / + add), and the split-a-braindump UI.
- **Slice 2, the Library** (`app/(main)/library/`): replaces Rediscover. Hubs lens (rollup by count with nesting) + hub detail (glints, the DAG both ways, facets) + a Time lens (chronological, cold-start default) + entity-aware search. Nav swapped Rediscover to Library (the dice keeps the old spin).
- **Slice 3, the Nest entity rewire:** `build-graph.ts` gained an entity dimension (hubs linking >=2 glints become teal rings), toggleable, with node->Library navigation. Off by default.
- **Two adversarial code reviews ran** (entity+Library, and Nest); both came back clean or with only cleanups, which were applied.

**Verification reality:** everything type-checks and builds clean, and the flows were exercised in a local browser (capture, chips, split, Library lenses, search, the Nest graph counts). The animated Nest canvas could not be screenshotted (the tooling times out on the force graph), so its visual was verified via graph-count deltas and pixel sampling, and by a clean adversarial review, not a screenshot. **No one has opened the actual Vercel preview for this branch yet** (see What to do next, pick 4).

---

## What to do next (from a five-sweep audit, reconciled by a completeness critic)

Ordered. The first two are Chris-only preconditions that gate the rest.

### Top picks

1. **[Chris, decision + dashboard] Clear the security precondition, and decide if it jumps ahead of Slice 4.** Rotate the `dogsled@dogsled.dev` app password and `SUPABASE_DB_PASSWORD` (both sit in public git history), stand up SMTP, fix the `www`/apex callback allow-list. Steps: `docs/SOP.md` §2. **Why it may be the real next priority:** it unblocks per-user auth, which unblocks the opt-in daily email/text trigger, and that trigger (not more entity polish) is the actual retention mechanism in `docs/MAGPIE_2.md`. The critic argued this outranks Slice 4. Chris's call.

2. **[Chris, precondition] Snapshot the DB before running any `--write` script.** There is ONE Supabase project behind dogfood, the preview, and the 168-topic public showcase. No staging, no env split. Every mutating script below is a live write against the showcase with weak rollback. Take a dump or stand up a throwaway rehearsal account first. This gates picks 3 and 5.

3. **[MOSTLY DONE, re-checked 2026-07-12] The 36-topic backfill hole is closed.** A read-only `scripts/backfill-entities.mjs --limit=0` (no model calls, no writes) now reports **1** unlinked plain topic, not 36. The backfill was evidently completed since 2026-07-11. Not worth gating a DB snapshot for a single topic; fold it into the next real `--write` if one happens. (The "6 links would write" it prints are the idempotent Phase-A group re-links, already present.)

4. **Open the Vercel preview and walk the branch at 375px.** Confirm Vercel serves a `feat/magpie-2` preview, sign into the shared account, and click through `/home` (capture chips + split), `/library` (hubs / time / search), `/library/[id]`, and `/nest` (the Entities toggle, teal rings, node->Library tap). This is the fastest way to knock out the biggest untested unknowns (the live preview, the Nest canvas visual, cold-start, mobile). `npm run dev` locally is the fallback.

5. **[BUILT + investigated 2026-07-12] The merge tool exists, and the finding is: there is almost nothing to merge.** `scripts/merge-entities.mjs` is committed (`44399ef`): `--detect` (read-only dupe scan), default dry-run, `--write`; it re-points links/edges/aliases before deleting the loser and records the loser's surface form as an `entity_aliases` row (the writer `findOrCreateEntity` reads, which turns prompt-time reuse on). **But running `--detect` against the live 286 entities surfaced zero clean surface-form dupes.** The audit's suspected dupes are wrong: `ai`(6) and `large language models`(11) share ZERO glints and are a legit broader/narrower **nesting** pair (already edged), same for `perception`/`color perception` and `economics`/`behavioral economics`. `canonical_key` + prompt-reuse already prevent the obvious dupes. So `MERGES` is intentionally empty; **do not run a merge pass, there is nothing to gain and real downside risk.** Keep the tool for when true dupes appear. **The actual noise is elsewhere:** ~10 zero-glint auto-created "broader" hubs (`design`, `planets`, `cartography`, `communities`, `philosophers`, `software tools`, `music genres`, ...). That is the **auto-nesting** decision (§6.5 / the flag below), NOT a merge problem. Before any future `--write` of this script: snapshot the DB and adversarially review the re-point logic (it is inert now with an empty list, but it is the most dangerous script in the repo).

### By area

**Build (Slice 4 and deferred):**
- **[DONE 2026-07-12]** ~~First, fix a factual error in the canonical spec.~~ `REDESIGN.md` §3.7 now matches the code: the `persona` tab renders `ConvoMode` (the Maggie chat) and the fifth tab is Thoughts (`PersonaMode`, bullets). A "Code reality" note there spells out that the merge is additive (the chat thread already exists as tab 1), which should drive the Slice 4 plan.
- **Slice 4 is smaller than the doc implies but risk-concentrated.** The chat thread already exists as tab 1, so the merge is "fold Brief/Challenge/Questions into Maggie as inline chips + demote Thoughts to a linked notes view," no migration (storage all present). Do it additively (old tabs stay live until a final flip): opener-seed fallback, notes view as its own entry, merged thread behind a temp tab, harden the persistence seam, flip the default, then retire the umbrella. Pre-work the spec understated: `brief_seed` is written but read nowhere and only for long glints (needs an opener fallback chain brief_seed -> cached Brief -> Haiku opener); there is no AI-off master toggle (treat "AI unavailable" as the degraded path); `default_mode` values (`brief`, `thoughts`) will dead-end and need a mapping.
- **[DONE 2026-07-12]** ~~Cheapest deferred graph feature: the "see as nest" reverse jump~~ (`REDESIGN.md` §4.5). Shipped in `9bf092e`: a hub page with >=2 glints gets a "see as nest" link to `/nest?focus=<entityId>`; the Nest lands with the entity layer on and flies to the hub via the existing `setFocus`. Optional one-time `focusNodeId` prop on `NestCanvas`; Reset clears it. Verified in-browser (entity layer flips on, 205->237 nodes, no console errors).
- **Deferred, correctly not built (logged so nothing is lost):** hub-level "talk it through" (gated on decision 6.1), resurfacing patterns 1 and 3 (recency "keeps returning" + temporal echo), Facets/Subjects Library lenses, nesting-authoring UI, Phase C subjects-as-entities.
- **Bigger spine still missing, all gated on per-user auth (pick 1):** the daily email/text trigger, per-user auth, the public logged-out read view, item controls (Favorite/Dismiss/Highlight), controlled facet vocabulary, server-side STT voice, accessibility settings, Nest short-name labels.

**Data / ops:**
- Regenerate `lib/supabase/types.ts` (it has none of the 0008/0009 tables; 21 narrow `as unknown as {from}` cast sites depend on the gap). Needs `supabase login` (Chris). **Treat this as a real refactor, not cleanup:** dropping the casts will surface genuine nullability/shape errors tsc cannot see today, so budget a verification pass, and first confirm the applied 0009 matches the checked-in SQL (SQL-editor drift encodes silently).
- Do NOT retire the umbrella / `is_group` dual-write yet (correctly gated on Slice 4; 3 live groups: Red Rising, Corvids, Gemini Meetup). Keep it tracked so it does not become permanent.
- The `/gemini` backdoor still works: the landing section is gone but `app/gemini/route.ts` + `geminiLogin` + the seeded Gemini group and 6 children survive. Retire the route and the data together when the meetup is truly done.
- Migration state is clean (head 0009 applied; the 0002 gap is the intentional krava/linq removal). Branch fully pushed.

**Decisions for Chris (mostly `REDESIGN.md` §6):**
- The big sequencing call: security rotation vs Slice 4 as the next marquee (critic says rotation wins).
- §6.4 entity-merge affordance: ship it? (gates pick 5).
- **[PROTOTYPED 2026-07-12, `4a1dabd`, awaiting Chris's call] Auto-nesting §6.5.** The old code auto-wrote `broader` at capture, minting a broader hub with no undo. Evidence (`merge-entities.mjs --ghosts`): 22 zero-glint hubs, ~half valuable rollups (`sports` gathers 11, `cities`/`film`/`literature` 5 each) and ~half single-child noise (`mollusks`->octopuses, `toys`->lego, `planets`->venus). So §6.5's literal "never automatic" would lose the good rollups. Shipped prototype is a **hybrid**: auto-link the broader edge only when the parent hub already exists (a proven rollup), else surface a one-tap "nest under X?" chip (`components/home/nest-suggestions.tsx` + `acceptNesting`); a new broader hub is minted only on accept. It is one predicate in `addTopicViaMagpie`, so pure-auto and pure-proposed are one-line flips. **Decision for Chris:** adopt the hybrid (recommended), or flip to pure-auto / pure-proposed. Going-forward only; the 11 existing single-child ghosts are left as seeds the hybrid grows (prune is a separate, optional, gated call). Not pushed, so the live preview still runs the old auto behavior until you flip.
- §6.1 hub-level convo storage (`conversations.entity_id` or read-only forever); §6.2 auto-connect semantics; §3.3 whether to fully swap out the fuzzy matcher now that backfill ran. Plus the settled-but-wanting-a-call ones: the one dogfood metric (recommend D7 return), email before SMS, per-user facet cap 20, when global streak rank turns on.

**Verification / QA:**
- **No lint gate has ever run.** `next lint` is deprecated and interactive; there is no `eslint.config.*` despite eslint 9 in deps, so exit 0 is a false pass. Add a flat `eslint.config.mjs`. The most bug-prone new code (the Nest force canvas, the optimistic-streak client components) is exactly what lint catches and tsc cannot.
- **Zero automated tests exist.** At minimum, add smoke coverage for the `lib/queries/entities.ts` cast path (the most fragile, untyped surface).
- Device/deploy-only checks: the Nest canvas visual, the Library cold-start Time default on a fresh (<5 glint) account, mobile 375px across the new surfaces, iOS mic on Chris's iPhone.
- Confirm the 3 live `is_group` topics have matching entity hubs, else Slice 4's "re-point group pages at hubs" will orphan them.

**Cleanup (lower priority):**
- **[DONE 2026-07-12, `eb75165`]** ~~Add `revalidatePath('/library')` to `captureGlint` and `addTopicViaMagpie`.~~ Both catch paths now revalidate `/library`.
- **[DONE 2026-07-12, `eb75165`]** ~~`getNestGraph` swallows the three entity-read errors.~~ It now logs each and degrades (drops the teal layer) instead of failing silently or nuking the graph.
- **[DONE 2026-07-12, `eb75165`]** ~~`suggestEntities` is a dead export.~~ Wired into `EntityEditor` as a lazy `<datalist>` typeahead on `+ add` (progressive enhancement, can't regress the input).
- **STILL OPEN (Chris's call):** unify the two teal greens: the Nest hubs use `#35C99A`, the Library uses `var(--teal)` `#1D9E75`, same concept across surfaces the user bounces between. Left as a brand decision, not slammed in.
- Delete the test-data catch **"What is a daily glint and why do people keep one?"** (+ its `daily glint` singleton) IF it is a verification artifact; two other 2026-07-11 catches are plausibly real dogfood, so this is Chris's call (do not delete real dogfood).

### Watch-outs (the traps)

- **One database, no safety net.** Snapshot before any `--write`. A merge-script bug re-pointing links to the wrong keeper corrupts the demo and the dogfood spine at once.
- **The proliferation doom-loop, re-scoped 2026-07-12:** the dominant term is NOT duplicate hubs (a `--detect` scan found ~none; `canonical_key` + prompt-reuse hold the line). It is **auto-`broader` nesting** minting zero-glint parent hubs with no undo (`design`, `planets`, `cartography`, ...). So the lever is the §6.5 auto-nesting decision, not merge. The merge tool now exists (`44399ef`) and its alias-writer turns reuse on when real dupes eventually appear, but there is nothing to run it on today.
- **The 30-second-catch SLA now degrades with entity count:** every catch injects all 286-and-growing entity names into the Haiku prompt and then serially loops find-or-create + link (+ a second find-or-create for `broader`) per entity. Measure the real latency on the preview before assuming it is fine; consider filtering `getEntitiesLite` to hubs with >=1 link before it feeds the prompt.
- **Slice 4's core risk is polluting the notes surface.** The `thoughts` write must be reachable ONLY from the "i'll just talk" branch. Also decide the chip cache-vs-reroll semantics explicitly ("push me" twice returns the same cached challenge unless `reroll:true`).
- **Sequencing chains to hold:** security rotation -> per-user auth -> daily trigger + public read view + honest first-person voice. And: Slice 4 -> re-point group pages at hubs -> freeze `is_group` -> retire the umbrella dual-write. The dual-write accumulates divergence the longer Slice 4 waits, but retiring it early orphans the 3 groups. Do not pull that thread out of order.

---

## How to talk to Chris (read twice)

**Voice in working sessions:** high-energy surfer-bro casual ("brudha," "stoked," "rad"). Match it for technical work and banter. Shift to a refined editorial register for finished copy, anything client-facing, or anything touching his co-founder Jessica / fastinsights.io.

**AI tells Chris hates:** em dashes (zero, ever: use periods, commas, parentheses, colons); "actually" as a defensive qualifier; marketing words ("unlock," "amazing," "supercharge," "seamless," "next-level"); excessive hedging.

**Chris likes:** direct opinions with reasoning, concrete over abstract, engineer-first detail, options over one default when naming, honest pushback when he is wrong, diagrams and mockups to align before coding. He moves fast and delegates ("go with your recommendations"): make a clear pick and execute, keeping prod-affecting actions gated on his explicit go.

**Coordinate before irreversible/outward moves.** Pushing to `master` auto-deploys to prod. He runs Supabase/Vercel/DNS dashboard actions and applies migrations (you cannot apply DDL from here). You drive the code and git.

---

## Env and tooling realities

- **`.env.local` has** `NEXT_PUBLIC_SUPABASE_URL` + `_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`. It does NOT have `SUPABASE_DB_PASSWORD`; `DEMO_LOGIN_PASSWORD` is empty. Local login works via the passwordless service-role path.
- **You cannot apply DDL from here** (the service-role key only reaches the PostgREST data API). Chris runs migrations in the Supabase SQL editor; write the SQL, hand him the paste-able block, then verify with a read-only script (pattern: `scripts/db/verify-0009.mjs`).
- **The 0009 tables are not in `lib/supabase/types.ts`,** so entity queries use a narrow `(supabase as unknown as { from })` cast with a comment. Regenerate once a DB connection is available and drop the casts (see the data/ops note; it is a real refactor).
- **ONE Supabase project** backs dogfood, the preview, and the public showcase. No staging. Snapshot before writes.
- **Read scripts run with** `node --env-file=.env.local scripts/...mjs`. A bare `node -e` without `--env-file` will not see `.env.local`.
- **The browser preview tooling times out screenshotting the animated Nest canvas,** and its `type` action sometimes does not fire React onChange. Drive inputs via the page (native setter + input event + `requestSubmit`) when verifying capture; verify the graph via node/link counts and pixel sampling.
- **Clear `.next` before any build or dev** (`Remove-Item -Recurse -Force .next`).

---

## Stack and ops

- Next.js 15 (App Router, TS strict), Supabase (Postgres + RLS + Auth + Storage), Anthropic (Sonnet 4.5 `claude-sonnet-4-5-20250929`, Haiku 4.5 `claude-haiku-4-5-20251001`), Vercel, Tailwind + shadcn/ui.
- `lib/queries/` is the single source of truth (UI + AI share it).
- **Repo:** `github.com/dogsleddev/magpie`. Push to `master` auto-deploys to magpie.wiki. **2.0 lives on `feat/magpie-2`** (its own Vercel preview). Merge to master only when a slice is proven and Chris green-lights the deploy.
- Migration head: `0009_entities.sql` (applied). `master` is at 0007.

---

## Hard rules (do not violate)

- **No em dashes** anywhere (code, comments, copy, commits). Sweep new docs before committing.
- **Do not invent taglines or microcopy.** Use `MESSAGING.md` / `MICROCOPY.md`. The one locked hero line is _Collect curiosities. Talk them through._
- **RLS everywhere.** No service-role key in the client. Every new table gets the four-policy `auth.uid() = user_id` pattern; join tables gate through the parent.
- **No Anthropic SDK in the client.** All model calls go through server routes / server actions.
- **Mobile-first at 375px.** Verify before calling anything done: `npm run type-check`, clean `npm run build`, and exercise the real flow. Coordinate before pushing to master.

---

## Security precondition (elevated: see top pick 1)

Slice-0 and the current entity work run on the shared account and need none of this. Per-user auth (Phase 1) does: **[Chris]** rotates the `dogsled@dogsled.dev` app password and `SUPABASE_DB_PASSWORD` (both in public git history), stands up SMTP, and fixes the `www`/apex callback allow-list, before the default entry flips from demo-login to signup. Steps: `docs/SOP.md` §2. Non-breaking; nothing running depends on those values.

---

## Terminology (settled)

- **Glint** = the catch and the streak unit, a curiosity in the user's own words (~5-6 word median, kept verbatim).
- **Entity** = what a glint is about (a noun hub: wolves, Yellowstone). Many-to-many, nests into broader hubs. The connective spine. New this arc.
- **Facet** = the lens/angle (paradox, evolution). Cross-cutting, unchanged.
- **Curiosity** = the user-facing collection word. **Topic** = the internal code entity (the `topics` table; a glint IS a topic row).
- **Persona = Maggie. Brand / product / domain = Magpie.**

🪶
