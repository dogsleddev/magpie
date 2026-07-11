# Magpie · SOP (build plan)

*Updated 2026-07-10 (Magpie 2.0, glint-first). The operating playbook. Requirements: `docs/BRD.md`. The canonical product model + schema: `docs/MAGPIE_2.md`. Build log: `PROGRESS.md`.*

"What to do next, in order, who does what." **[Chris]** = dashboard, secrets, migrations, go-aheads. **[Claude]** = code. The order comes from a hard adversarial critique (2026-07-10): prove the glint loop is fun on the shared account before building auth, itemization, or anything else. Auth is the gate to letting strangers in, not the gate to building the room.

---

## 0. State right now

- Magpie is live at magpie.wiki as a shared-account community. That app stays live and untouched while 2.0 is built on a WIP branch.
- The pivot is the focus. LinkedIn launch is parked.
- The daily habit is the **glint** (catch a curiosity, keep the streak), not a spaced-repetition review. See `docs/MAGPIE_2.md`.

---

## 1. Slice-0: prove the loop (no auth, no preconditions)

Build behind `/home` on the existing shared account. No per-user auth, no SMTP, no bucket, no `response_items`. Every item ships behind the gate: `npm run type-check`, clean `npm run build`, exercise it in the browser, coordinate the push. Migrations are `[Claude]` to write, `[Chris]` to run in the Supabase SQL editor.

1. **Timezone plumbing.** *[small]* **[Claude]** Add `user_settings.timezone` (IANA, default `America/Los_Angeles`), captured client-side with `Intl.DateTimeFormat().resolvedOptions().timeZone`. **[Chris]** Run the migration. Everything dated depends on this, so it is first.
2. **Catch a glint.** *[med]* **[Claude]** A one-line capture on a minimal `/home` that creates a topic via the smart 1-to-3-word entry, committing optimistically (keyboard drops instantly, categorization runs async). Multiple glints per day. Add `topics.brief_seed` and `topics.raw_input`. **[Chris]** Run the migration.
3. **Glint to connection.** *[med]* **[Claude]** On capture, a Haiku match against existing topic titles plus facets renders 2-3 tappable connection chips; a chip links or promotes. Local title/facet index first (instant), Haiku enrichment async. This is the middle verb; do not skip it.
4. **Glint-fired streak.** *[med]* **[Claude]** `activity_days` table (covered local dates), current/longest derived, 7-day recovery via make-up entries, timezone-correct. Catching a glint covers today. **[Chris]** Run the migration.
5. **Minimal Home + analytics.** *[small]* **[Claude]** Today's capture, the streak number, a small activity strip, and a `usage_events` table logging D1/D3/D7 events from day one. **[Chris]** Run the migration.

**Then dogfood it daily for about two weeks.** Pick the one metric first (candidate: D7 return rate). If the loop does not make you want to open the app tomorrow, stop and rethink before building the other phases. This is the whole point of Slice-0.

---

## 2. Phase 1: let real users in

Now the auth preconditions matter. Start these `[Chris]` tasks in parallel with the code.

- **[Chris]** Rotate the leaked credentials before real signups (the `dogsled@dogsled.dev` app password and `SUPABASE_DB_PASSWORD`, both in public git history). Steps inline below and in `qc-audit/OWNER_ACTIONS.md` section 1 (note: that file is untracked/local; the steps are: reset the app password in Supabase Auth > Users, reset the DB password in Project Settings > Database, update local env on both machines). Non-breaking.
- **[Chris]** Stand up email/SMTP in Supabase Auth (confirmations, resets, and the daily trigger).
- **[Chris]** Fix the `www` vs apex callback allow-list (Supabase Auth redirect URLs).
- **[Claude]** Email + password signup and login; retire the shared demo-login as the default entry; keep the starter-pack seed (not the flaky AI interest-picker); post-login lands on `/home`.
- **[Claude]** The public read view (decision 12): showcase content is world-readable; logged-out visitors browse Grid, curiosities, Facets, Nest, but never a dashboard. Public-read RLS on showcase content only. **[Chris]** Confirm which account is the flagship public showcase (the 168-topic account, decision 13).
- **[Claude]** The daily trigger: opt-in email (Vercel Cron + Resend, ~7am local). SMS later (Twilio, costs per message, needs a phone number). This is what actually brings users back, and only works now that accounts exist.

---

## 3. Phase 2: saveable content and voice

- **[Claude]** `response_items` itemization with a `generation_id` / `is_current` marker (fixes reroll: favorited item text does not vanish, stale rows excluded). Capture `spice` and `gen_temperature` (columns only). **[Chris]** Run the migration.
- **[Claude]** Binary Favorite / Dismiss / Highlight on Brief/Challenge/Questions items; Highlight routes to Maggie and stores a tagged thought.
- **[Claude]** Voice, server-side speech-to-text (record audio, transcribe server-side), because iOS Web Speech is dead. The priority right after the structural work.
- **[Claude]** Controlled facet vocabulary (max 50 system-wide, 20 per user); reconcile existing facets. **[Chris]** Run the migration.

---

## 4. Phase 3 and beyond (in `docs/MAGPIE_2.md` section D)

Library resurfacing (Maggie brings back past glints and curiosities, which is the only thing "review" means, pull-based, no separate surface); the resurfacing engine; the cheap topic-tab reorder (hold the Maggie merge); embeddings (pgvector) only at scale (the chips are already Haiku-semantic from Slice-0, spike-validated, so embeddings are a scale optimization, not a quality step). Then individual-share community nests (invite-by-token via `SECURITY DEFINER`), adaptive-temperature behavior, favorite 1-to-10, colors/tags/search/stats, accessibility polish and the landing redesign, export, pricing, streak rank.

**Shared-account communities** (Gemini-style, decision 13a): an `account_type` (`personal` vs `shared_community`) that hides the dashboard and settings for shared logins, with an admin-only management view. Personal-habit features do not apply to a shared account.

**Parallel track (not in the [Claude] sequence):** the **Nest 3D toggle** is **[Chris], built with Fable**. A WebGL/orbit-controls render path over the same `lib/nest/build-graph.ts` output; does not block or depend on the sequence above. Spec: `docs/MAGPIE_2.md` C.11.

---

## 5. Migration-order traps to respect

- **Timezone before any dated table** (Slice-0 step 1 before steps 4 and 5), or the streak has no correct "today."
- **`/home` must exist before the wordmark and auth redirect point at it.** Slice-0 builds a minimal `/home` first, so this is fine; do not repoint the redirect until it exists.
- **`default_mode` CHECK (Phase where the tab reorder lands):** existing rows carry `'persona'`. Run `UPDATE ... SET default_mode='brief'` and `SET DEFAULT 'brief'` BEFORE adding the new CHECK, or the constraint fails on live data.
- **`response_items` needs its `generation_id`/`is_current` marker in the first version,** not bolted on later, or reroll ships broken.

---

## 6. Commands + flow (reference)

- **Dev:** clear `.next` (`Remove-Item -Recurse -Force .next`), then `npm run dev`.
- **Verify:** `npm run type-check`, clean `npm run build`, exercise it in the browser preview (drive the real flow).
- **Migrations:** `[Claude]` writes `supabase/migrations/00xx_*.sql`; `[Chris]` runs it before the code that needs it deploys.
- **Deploy:** merge to `master` + `git push` auto-deploys to magpie.wiki. Verify via `vercel-chris`. Keep 2.0 on a WIP branch until Slice-0 is coherent.
- **Secrets:** `.env.local` and `.mcp.json` are gitignored. Never commit them.
- **Copy:** no em dashes; pull taglines from `MESSAGING.md` / `MICROCOPY.md`; ship feature names when there is no locked line.
- **RLS:** every new table gets the four-policy `auth.uid() = user_id` pattern; the only exceptions are public-read on showcase content and the `SECURITY DEFINER join_nest` function, both deliberate.
