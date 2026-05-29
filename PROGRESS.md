# Magpie · Progress

**Last updated:** 2026-05-29 (session 3)
**Status:** Phases 1 to 5 complete and committed. Phase 6 is next.
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
| 4 | {persona} capture (bullets, mic, organize) | DONE |
| 5 | AI modes (Brief, Challenge, Questions, Convo) | DONE |
| 6 | Facets navigation | NEXT |
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
| `ANTHROPIC_API_KEY` | SET and FUNDED. Real `sk-ant` key in `.env.local`; account has credits. All five AI calls (Brief, Challenge, Questions, Convo, Organize) verified live against Sonnet 4.5 + Haiku 4.5. If live calls ever return HTTP 400 "credit balance too low," top up at console.anthropic.com (Plans and Billing). |
| DB pooler (admin scripts only) | `aws-1-us-east-2.pooler.supabase.com:5432`, user `postgres.tbmdwivhekzfkeidbwia` |
| Dev user | `dogsled@dogsled.dev` / `dogsled` (email-confirmed, works via password) |
| Supabase Auth URL config (Site URL + `/auth/callback`) | NOT confirmed. Magic-link sign-in needs it; dev password sign-in does not. Do this before testing magic link in the browser. |
| Supabase CLI | logged in and linked to the project |

Secret hygiene: the DB password and Supabase keys passed through chat this session. Rotate the DB password after the sprint (Supabase Dashboard > Settings > Database > Reset password). The `sb_publishable_` key is public by design (RLS protects data), no action needed.

---

## What is built (Phases 1 to 5)

**Phase 1 (commit `db1f977`):** app shell on the existing scaffold (not a fresh create-next-app). Root layout, magic-link login + dev password sign-in, `/auth/callback`, `(main)` shell (app bar + bottom tab bar), plumage-token `Button`/`Input`/`Wordmark`, root `middleware.ts`.

**Phase 2 (commit `592bae8`):** schema applied to Supabase (9 tables, RLS, triggers), generated `lib/supabase/types.ts`, full typed query spine in `lib/queries/*` (subjects, topics, facets, thoughts, conversations, discover, ai-cache, settings), idempotent seed action in `lib/actions/seed-starter-topics.ts`. Admin tooling in `scripts/db/`.

**Phase 3 (commit `e358cc2`):** home grid (`getSubjectsWithCounts`, dismissible welcome hint, Add topic [disabled until Phase 7] + Convo Roulette), starter-pack onboarding, subject page (facet chips with counts + client-side filter + topic list), topic detail (meta pills + 5 mode tabs, persona tab default with label from `user_settings.persona_name`). All verified end-to-end in the browser.

**Phase 4 (commit this session):** {persona} capture. New files: `components/mic/use-speech-to-text.ts` (Web Speech API, feature-detected) + `components/mic/mic-button.tsx` + ambient `components/mic/speech-recognition.d.ts`; `lib/actions/thoughts.ts` (add/edit/remove server actions over the query spine); `components/topic/persona-mode.tsx` (riff timer, input + mic + add, optimistic bullet list, click-to-edit, hover-delete, auto-save on Enter and mic-stop, Organize button at 3+, organize result card); `app/api/ai/organize/route.ts` (Sonnet via `organizePrompt`, JSON parse, seeds `discover_items` learn_more when `ai_suggestions` on, billing-aware errors). Wired into `mode-tabs.tsx` + the topic page (old placeholder removed). Refactored `lib/ai/client.ts` to lazy client init (it was throwing at module load, which broke `next build`). Verified in the browser: add/edit/delete persist across reload, Organize gates at 3+ and degrades cleanly with no credits, mic renders enabled in Chromium, no console errors.

**Phase 5 (commit this session):** AI modes. New files: `lib/ai/errors.ts` (`aiErrorResponse`, shared billing-aware 401/402/502 mapping); `lib/ai/text-mode.ts` (`handleTextMode`: read-through `ai_cache`, reroll clears + recalls); `app/api/ai/{brief,challenge,questions}/route.ts` (thin wrappers, Brief + Questions on Haiku, Challenge on Sonnet); `app/api/ai/convo/route.ts` (Sonnet streaming via `streamClaude`, reads history + persists the user turn, streams the reply); `lib/actions/conversations.ts` (`saveAssistantMessage`); `components/topic/text-mode.tsx` (fetch-on-mount, loading, `AIContent` formatter for numbered lists + the `*Tag.*` lead, Reroll) and `components/topic/convo-mode.tsx` (chat with opener, typing dots, streamed reply, Enter-to-send). Wired into `mode-tabs.tsx`; the topic page now also fetches `getConversation`. Refactored the Organize route onto the shared `aiErrorResponse`. Verified all four modes live in the browser (credits funded): Brief/Questions render numbered lists, Challenge renders the paradox tag, Convo streams and persists across reload. No console errors.

---

## Key decisions made this session

- **Next bumped to `^15.1.0` (resolved 15.5.18).** Next 15.0.0 only accepts React 19 RC as a peer; the project pins React 19 stable.
- **`@supabase/ssr` bumped 0.5.2 to 0.10.3.** The old version's `createServerClient<Database>` generic was not propagating the schema type, so every table resolved to `never`.
- **shadcn approach: hand-built primitives on the plumage tokens** (CVA, shadcn-style API) rather than the shadcn CLI, because the scaffold tokens (`--bg`, `--text`, `--teal`) do not match stock shadcn var names.
- **Auth: magic link + a dev-only password sign-in** (so testing does not need an email round-trip).
- **Fonts: kept the existing CSS `@import`** for Fraunces + DM Sans; `next/font` upgrade deferred to Phase 8.
- **DB pooler is `aws-1` (not `aws-0`)** for this project, and direct connection is IPv6-only. Captured as the default in `scripts/db/*`.
- **Fixed latent strict-mode `any` types** in the scaffold's `lib/supabase/server.ts` and `middleware.ts` cookie callbacks (the scaffold was never type-checked because node_modules never existed).
- **`lib/ai/client.ts` is now lazy.** It threw on a missing key at module load, and `next build` imports every route module when collecting page data, so the first AI route broke the build. Now `getClient()` checks the key at call time and throws a 401-tagged error the routes catch. Still compatible with the planned Krava wrap.
- **Thought CRUD = server actions; Organize = API route.** CRUD is pure DB (server actions + optimistic client state for snappy capture, no revalidate on every keystroke). AI stays in `app/api/ai/*` per the doc, so the Krava wrap stays a one-file change.
- **mic-stop IS the save** (per the gotcha). Stopping the mic commits the live transcript as a bullet; click-to-edit fixes messy dictation after.
- **Organize errors are billing-aware.** 401/403 maps to "add your key", credit-balance/quota maps to "out of Anthropic credits" (HTTP 402), everything else to a generic retry. Phase 5 extracted this into the shared `lib/ai/errors.ts` used by every AI route.
- **Text modes share one handler + cache.** `handleTextMode` runs the read-through `ai_cache` for Brief/Challenge/Questions, so those three routes are one-liners. Lazy fetch on tab activate (not all-on-load) keeps Anthropic spend down; the cache makes tab revisits instant.
- **Convo persistence avoids the cookies-in-stream trap.** All Supabase reads plus the user-message write happen at the route's handler top (request scope), before the streaming Response. The assistant turn is saved by the client via a server action once the stream finishes. The stream body only talks to Anthropic.
- **Convo opener is display-only.** "hey, what's pulling you on this one?" shows when there is no history; it is not persisted, so the saved thread is real exchanges only.

---

## Known issues and watch-outs

- **Welcome hint dismiss is session-only** (reappears on hard refresh). Persistent dismissal parked for Phase 8 polish.
- **Preview MCP is usable but finicky here.** Screenshots work (sometimes slow). Start ONE dev instance and wait for compile; a second `preview_start` on port 3000 collides and kills the server. The session cookie expires between sessions, so re-sign-in via the dev panel; `preview_fill` may not trigger React `onChange`, so set values via the native input setter scoped to the dev form.
- **Magic link is untested in-browser** until the Supabase Auth URL config is set (see secrets table). Dev password sign-in is the working path for now.
- **`pg` is a devDependency** used only by `scripts/db/*` admin helpers (apply migration, create user, smoke test). Not used by the app.
- **Anthropic credits: funded and verified.** All AI modes return real output. The routes still degrade gracefully (HTTP 402 "out of Anthropic credits") if the balance hits zero again.
- **No ESLint config yet.** `npm run lint` drops into `next lint`'s interactive setup prompt (and `next lint` is deprecated in Next 16). type-check + build are the real gates. Set up a flat ESLint config in a polish pass.
- **`next build` on OneDrive can hit `EINVAL readlink .next`.** A crashed or partial build leaves OneDrive-virtualized artifacts that break the next build. Fix: delete `.next` before rebuilding. Also delete `.next` before `npm run dev` if you just ran a production build (a prod `.next` makes the dev server crash on start).

---

## Next steps: Phase 6 (Facets navigation)

Browse by Facet, the cross-subject lens. The query spine already has the facets query in `lib/queries/facets.ts` and `getTopicsByFacet` in `lib/queries/topics.ts` (confirmed working).

1. `app/(main)/facets/page.tsx`: list all facets with topic counts. The Facets bottom-tab routes nowhere today.
2. `app/(main)/facet/[id]/page.tsx`: one facet's topics across subjects via `getTopicsByFacet`. Each row shows its subject so the cross-cutting nature is visible.
3. Enable the Facets tab in `components/nav/bottom-tab-bar.tsx` (disabled stub today, same for Discover/Journal until their phases).
4. Header microcopy is locked: "where the connections live" (MICROCOPY.md).

After Phase 6: 7 (discover/add), 8 (settings/polish), 9 (deploy). Then branch to `hackathon` for the Krava + Linq integration.

---

## Commits this session

```
feat(phase-5): AI modes (Brief, Challenge, Questions, Convo) (this commit)
56b2ebe  feat(phase-4): persona capture, mic-to-text, organize route
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

### 2026-05-29 (session 2): Phase 4

- Built {persona} capture end to end: mic hook + button (Web Speech, feature-detected), thought CRUD server actions, the capture surface (riff timer, optimistic bullets, click-to-edit, hover-delete, auto-save on Enter and mic-stop), and the Organize route (Sonnet, learn_more to Discover, billing-aware errors).
- Refactored `lib/ai/client.ts` to lazy init after a module-load throw broke `next build`.
- Verified in the browser on the History "empire" topic: add/edit/delete persist across reload, Organize gates at 3+, mic renders enabled. Cleaned up the test thoughts after.
- Found the Anthropic account is out of credits (live AI returns HTTP 400). Organize degrades gracefully; flagged credits as the Phase 5 blocker.
- type-check and production build both green.

### 2026-05-29 (session 3): Phase 5

- Credits got funded; verified both models live before building (Sonnet + Haiku each answered a ping).
- Built the four AI modes: shared `aiErrorResponse` + `handleTextMode` (cached), the Brief/Challenge/Questions routes, the streaming Convo route + `saveAssistantMessage`, and the `TextMode`/`ConvoMode` components. Refactored Organize onto the shared error helper.
- Verified all four live in the browser on the History "empire" topic: Brief (Haiku numbered list), Challenge (Sonnet paradox tag), Questions (Haiku open questions), Convo (Sonnet streamed reply, persisted across reload). No console errors.
- Gotchas hit: a stale prod `.next` crashes `next dev` (clear it first); the session cookie expired (re-signed in); `preview_fill` needed the React-native value setter scoped to the dev form.
- Left a sample Convo thread + cached Brief/Challenge/Questions on the empire topic from testing (harmless; caching is intended behavior).
- type-check and production build both green.
