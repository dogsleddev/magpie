# Magpie · Progress

**Last updated:** 2026-05-29 01:49 PT
**Status:** Phases 1 to 3 complete and committed. Phase 4 is next.
**Branch:** `master`
**Hackathon clock:** Krava x Linq, Saturday May 30 2026, Frontier Tower SF. Base product (Phases 1 to 9) should be live before then.

This is the living "where are we" doc, updated every session. For "what Magpie is," read `HANDOFF.md` and `CLAUDE.md`. For the full build plan, read `docs/BUILD_PLAN.md`.

---

## Resume in 30 seconds

```powershell
cd C:\Users\dough\OneDrive\02_Projects\Magpie\code
npm run dev
```

Open `http://localhost:3000`. On the login screen, expand **Dev sign-in (password)** and use:

- Email: `dogsled@dogsled.dev`
- Password: `dogsled`

The account is already seeded (13 subjects, ~113 topics, 18 facets). You land on the grid.

---

## Phase status

| Phase | Title | Status |
|---|---|---|
| 1 | Scaffold + Auth | DONE |
| 2 | Schema + Queries | DONE |
| 3 | Home + Subject Navigation | DONE |
| 4 | {persona} capture (bullets, mic, organize) | NEXT |
| 5 | AI modes (Brief, Challenge, Questions, Convo) | not started |
| 6 | Facets navigation | not started |
| 7 | Discover + Add Topic | not started |
| 8 | Settings + Polish | not started |
| 9 | Deploy to magpie.wiki | not started |

Post-MVP and hackathon work tracked in `docs/BUILD_PLAN.md` and `docs/HACKATHON_KRAVA_LINQ.md`.

---

## Environment and secrets state

| Item | Value / status |
|---|---|
| Supabase project | `magpie`, ref `tbmdwivhekzfkeidbwia`, region East US (Ohio) / us-east-2 |
| `.env.local` Supabase URL + anon + project id | SET |
| `ANTHROPIC_API_KEY` | PENDING. Line is waiting in `.env.local`. Needed for Phase 4 Organize and all of Phase 5. |
| DB pooler (admin scripts only) | `aws-1-us-east-2.pooler.supabase.com:5432`, user `postgres.tbmdwivhekzfkeidbwia` |
| Dev user | `dogsled@dogsled.dev` / `dogsled` (email-confirmed, works via password) |
| Supabase Auth URL config (Site URL + `/auth/callback`) | NOT confirmed. Magic-link sign-in needs it; dev password sign-in does not. Do this before testing magic link in the browser. |
| Supabase CLI | logged in and linked to the project |

Secret hygiene: the DB password and Supabase keys passed through chat this session. Rotate the DB password after the sprint (Supabase Dashboard > Settings > Database > Reset password). The `sb_publishable_` key is public by design (RLS protects data), no action needed.

---

## What is built (Phases 1 to 3)

**Phase 1 (commit `db1f977`):** app shell on the existing scaffold (not a fresh create-next-app). Root layout, magic-link login + dev password sign-in, `/auth/callback`, `(main)` shell (app bar + bottom tab bar), plumage-token `Button`/`Input`/`Wordmark`, root `middleware.ts`.

**Phase 2 (commit `592bae8`):** schema applied to Supabase (9 tables, RLS, triggers), generated `lib/supabase/types.ts`, full typed query spine in `lib/queries/*` (subjects, topics, facets, thoughts, conversations, discover, ai-cache, settings), idempotent seed action in `lib/actions/seed-starter-topics.ts`. Admin tooling in `scripts/db/`.

**Phase 3 (commit `e358cc2`):** home grid (`getSubjectsWithCounts`, dismissible welcome hint, Add topic [disabled until Phase 7] + Convo Roulette), starter-pack onboarding, subject page (facet chips with counts + client-side filter + topic list), topic detail (meta pills + 5 mode tabs, persona tab default with label from `user_settings.persona_name`). All verified end-to-end in the browser.

---

## Key decisions made this session

- **Next bumped to `^15.1.0` (resolved 15.5.18).** Next 15.0.0 only accepts React 19 RC as a peer; the project pins React 19 stable.
- **`@supabase/ssr` bumped 0.5.2 to 0.10.3.** The old version's `createServerClient<Database>` generic was not propagating the schema type, so every table resolved to `never`.
- **shadcn approach: hand-built primitives on the plumage tokens** (CVA, shadcn-style API) rather than the shadcn CLI, because the scaffold tokens (`--bg`, `--text`, `--teal`) do not match stock shadcn var names.
- **Auth: magic link + a dev-only password sign-in** (so testing does not need an email round-trip).
- **Fonts: kept the existing CSS `@import`** for Fraunces + DM Sans; `next/font` upgrade deferred to Phase 8.
- **DB pooler is `aws-1` (not `aws-0`)** for this project, and direct connection is IPv6-only. Captured as the default in `scripts/db/*`.
- **Fixed latent strict-mode `any` types** in the scaffold's `lib/supabase/server.ts` and `middleware.ts` cookie callbacks (the scaffold was never type-checked because node_modules never existed).

---

## Known issues and watch-outs

- **Welcome hint dismiss is session-only** (reappears on hard refresh). Persistent dismissal parked for Phase 8 polish.
- **Preview MCP screenshots time out on this machine.** Verification used accessibility snapshots instead (they prove structure + copy). Eyeball the visual via `npm run dev`.
- **Magic link is untested in-browser** until the Supabase Auth URL config is set (see secrets table). Dev password sign-in is the working path for now.
- **`pg` is a devDependency** used only by `scripts/db/*` admin helpers (apply migration, create user, smoke test). Not used by the app.

---

## Next steps: Phase 4 ({persona} capture)

The heart of the app. Build, in order:

1. `components/topic/persona-mode.tsx`: riff timer pill, input + mic + Add, bullet list, click-to-edit, hover-delete, "Organize with AI" button at 3+ bullets. Replaces the placeholder in the persona tab.
2. `components/mic/use-speech-to-text.ts` (Web Speech API hook, feature-detected) and `components/mic/mic-button.tsx` (pulses while recording, disabled with tooltip where unsupported).
3. Server actions wrapping `createThought` / `updateThought` / `deleteThought`. Auto-save on Enter and on mic-stop (no Save button, per the gotchas).
4. `app/api/ai/organize/route.ts`: Sonnet + the Organize prompt from `lib/ai/prompts.ts`. Side effect: insert `learn_more` items into `discover_items` when `ai_suggestions` is on. **Needs `ANTHROPIC_API_KEY`.**
5. Render the organize result outside the persona card so it persists across new bullets.

Everything except step 4 works without the Anthropic key. Drop the key into `.env.local` to test Organize for real.

After Phase 4: Phase 5 (AI modes) is the other big AI lift, then 6 (facets nav), 7 (discover/add), 8 (settings/polish), 9 (deploy). Then branch to `hackathon` for the Krava + Linq integration.

---

## Commits this session

```
e358cc2  feat(phase-3): home grid, subject + topic navigation, onboarding
592bae8  feat(phase-2): schema applied, typed query spine, seed action
db1f977  feat(phase-1): app shell, magic-link auth, branded home
b6ed98e  chore: baseline scaffold snapshot before Phase 1
```

---

## Session log

### 2026-05-29 (session 1): Phases 1 to 3

- Mapped the scaffold (config + lib helpers existed; no app shell, no node_modules, no git).
- Phase 1: installed deps, fixed the Next/React peer conflict, built the app shell and auth, verified `/` to `/login` redirect and the branded login render.
- Wired real Supabase creds, verified the project is live.
- Phase 2: applied the schema via the pooler, generated types, fixed the ssr `never`-types issue, built the whole query spine + seed action, created and verified the dev user, smoke-tested the query layer against the live DB.
- Phase 3: built home grid, subject and topic navigation, and starter-pack onboarding. Drove the full flow in the browser (sign in, seed, browse subject, open topic). Seeded the dogsled account.
- Wrote this progress doc.
