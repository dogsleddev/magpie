# Magpie · SOP (next steps)

*Updated 2026-06-01 (session 7, post-landing + QC). The operating playbook from here. High-level view: `docs/STATUS.md`. Requirements + roadmap: `docs/BRD.md`. Build log: `PROGRESS.md`.*

This is the "what to do next, in order, who does what." **[Chris]** = dashboard, secrets, go-aheads. **[Claude]** = code.

---

## 0. State right now

- **Landing page built + verified**, committed to branch **`feat/landing-page`** (through commit `29d33f0`). **Not deployed.** `master` still equals prod.
- App grid moved from `/` to **`/app`**; `/` is the public marketing landing.
- Waitlist wired (needs the table). Demo login cleaned up (password-first + logging).
- QC pass done: dead auth forms removed, search wildcard escaping fixed, build green.

---

## 1. Ship the landing (do this first)

1. **[Chris]** Supabase to SQL Editor, run `supabase/migrations/0003_waitlist.sql`. Creates the waitlist table (anon insert, no public read).
2. **[Chris, optional]** Add `DEMO_LOGIN_PASSWORD` to `.env.local` if you want "Enter Magpie" working on localhost (same value as Vercel).
3. **[Claude]** `git checkout master; git merge feat/landing-page`.
4. **[Claude]** Clear `.next`, `npm run build` (final gate).
5. **[Chris]** Green-light the deploy.
6. **[Claude]** `git push` (auto-deploys to magpie.wiki).
7. **[Claude]** Verify prod via `vercel-chris`: build logs, live `/` and `/app`, one waitlist submit, demo login.
8. **[Chris]** LinkedIn post pointing at magpie.wiki (it has a destination now).

## 2. Launch-week lockdown (after ~1 week)

- **[Chris]** Set `DEMO_OPEN=false` in Vercel. Hides "Try the demo", triggers a redeploy. The waitlist stays the front door.

---

## 3. UI phase (the next build block, in order)

From BRD 7.3 + the persona revert. The query spine for most of these already exists (kept during QC), so it is mostly UI wiring.

1. **Persona revert finish** (Maggie everywhere): migration default, live `user_settings.persona_name`, threaded `personaName`. The landing already says Maggie. *[small]*
2. **Home nav in the upper right.** *[small]*
3. **Edit / delete topics + subtopics.** Spine ready: `updateTopicTitle`, `deleteTopic`. *[med]*
4. **New-user subject/facet onboarding** (Substack-style). *[med]*
5. **Settings screen**: persona rename, AI toggle, Glints toggle, default mode. Spine ready: `updateSettings`. *[med]*
6. **Custom tone/personality for Maggie + guardrails.** *[med]*
7. **3D curiosity graph (Nest View)**: "the shape of your curiosity," nodes weighted by talk-time, facet + memory edges. Frame per COMPETITORS §3, not "another AI diagram." *[large]*

Every item ships behind the same gate: `npm run type-check`, clean `npm run build`, exercise it, coordinate the push.

## 4. The rest (later)

iPhone app (native vs PWA), finish the real Linq inbound loop, verify Krava routes on prod, screenshot-and-converse capture, "where'd you hear it" provenance, social.

---

## 5. QC findings (session 7)

**Removed** (dead, not roadmap):
- `components/auth/dev-sign-in.tsx`, `components/auth/magic-link-form.tsx`: unused since login became the one-click `demoLogin`.

**Fixed:**
- `searchTopics` now escapes LIKE wildcards (`%` `_` `\`).
- `demoLogin` rewritten: password-first, failures logged, `redirect()` kept outside try/catch.

**Kept on purpose** (roadmap scaffolding, per the CLAUDE.md query-spine architecture):
- Unused `lib/queries/*` CRUD (`deleteTopic`, `updateTopicTitle`, `deleteSubject`, `updateSettings`, `clearCached`, the Discover ops, ...). These are the typed query spine the UI phase above wires up.
- `lib/ai/prompts.ts` Draw Out / Extract / Related stubs.

**Flagged (your call):**
- `lib/supabase/client.ts` is now unreferenced (only the removed forms used it). Kept as standard Supabase browser-client infra for future signup auth. Say the word to remove it too.
- `lib/linq/store.ts` `getUserIdByPhone` is unused (the webhook queries inline). Revisit when finishing the Linq loop.

## 6. Deferred tech debt (fix during the relevant phase)

- **Convo persistence on mid-stream error** saves a fallback line as a real assistant turn; a closed tab can leave a dangling user turn. *(Convo work)*
- **`appendMessage` is non-atomic** (`lib/queries/conversations.ts`); matters more now Linq can drive the same convo. Fix: a jsonb append RPC. *(Convo/Linq work)*
- **No `error.tsx`** on `(main)` routes: a transient throw shows the raw Next error screen. Cheap robustness add. *(quick win)*
- **Mic capture overwrites typed input.** *(capture polish)*
- **`extractJSON` is fragile**; Add Topic categorization is non-deterministic (Recent Ideas is the refile net). *(Add Topic polish)*
- **No ESLint config in the repo**, so unused code/imports are not auto-flagged. Consider wiring `next lint`. *(hygiene)*
- **Krava prod routing unverified**; **Linq inbound loop not real**; **repo public + secrets unrotated** (before a wider launch).

---

## 7. Commands + flow (reference)

- **Dev:** clear `.next` (`Remove-Item -Recurse -Force .next`), then `npm run dev`. OneDrive corrupts stale artifacts.
- **Verify:** `npm run type-check`, then a clean `npm run build`, then exercise it.
- **Deploy:** merge to `master` + `git push` = auto-deploy. Verify via `vercel-chris`.
- **Secrets:** `.env.local` and `.mcp.json` are gitignored. Never commit them.
- **Copy:** no em dashes; pull taglines from `MESSAGING.md` / `MICROCOPY.md`.
