# Magpie · Progress

**Last updated:** 2026-05-30 (session 4: deploy + QA hardening)
**Status:** Phases 1 to 5 complete and committed. Base app is **DEPLOYED and LIVE at https://magpie.wiki**. Magic-link sign-in is not finished (blocked on email delivery); a password sign-in option is live as the working way in. The hackathon split (SOP Step 5) is NOT done yet.
**Branch:** `master` (deployed commit `92476ae`)
**Hackathon clock:** Krava x Linq, Saturday May 30 2026, Frontier Tower SF. Base product is live; the split + Krava/Linq work is the next session.

This is the living "where are we" doc. For "what Magpie is," read `CLAUDE.md`. For the deploy runbook, `docs/SOP_SPLIT.md`. For the hackathon build, `docs/HACKATHON_KRAVA_LINQ.md`.

---

## START HERE next session (ordered)

1. **SECURITY, do this first (5 min).** The repo is PUBLIC and the dev password login is live on prod, so anyone could get into the `dogsled` account. Pick at least one, ideally both:
   - Make the GitHub repo **private** (kills public access including git history), and/or
   - **Rotate the `dogsled@dogsled.dev` password** in Supabase (Authentication > Users), then sign in with the new password. The old weak password is in this repo's git history, so rotation is the real fix.
2. **Finish magic link (for real attendees).** Wire **custom SMTP** (Resend free tier) in Supabase > Authentication > SMTP Settings (the built-in sender is rate-limited and not for production), AND add the **www** redirect URL `https://www.magpie.wiki/auth/callback` to Supabase > Authentication > URL Configuration. Then send one fresh magic link and confirm it lands on the grid. (See "The auth saga" below for why www matters.)
3. **Nail the split (SOP Step 5).** Branch `hackathon` off the green `master`, push it, assign `hackathon.magpie.wiki` to the `hackathon` branch in Vercel, smoke-test. `master` stays clean.
4. **Then** the Krava + Linq build on the `hackathon` branch (`docs/HACKATHON_KRAVA_LINQ.md`).

To just get in and use the app right now: go to **https://magpie.wiki**, expand **"Sign in with password"**, use `dogsled@dogsled.dev` + the password (rotate it first per item 1). Localhost also works: `npm run dev`, open `http://localhost:3000`, same password panel.

---

## What is live (deployment)

| Item | Value |
|---|---|
| Production URL | https://magpie.wiki (HTTPS, valid cert) |
| Apex behavior | `magpie.wiki` **307-redirects to `www.magpie.wiki`**, so the app effectively runs on www (matters for auth redirect allow-listing) |
| Vercel team | `dogsled` (`team_i1Es1eTRb83TisgbHEU6gcA5`), Chris's account, NOT Jessica's |
| Vercel project | `magpie` (`prj_Ko7a9i0drxCPWMccMT1yFrlj6ahC`), git-linked to `dogsleddev/magpie`, framework Next.js, auto-deploys on push to `master` |
| GitHub repo | `github.com/dogsleddev/magpie` (PUBLIC; commits authored as Chris Dougherty via repo-local git config) |
| Vercel env vars (Production) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY` all set. (NEXT_PUBLIC vars bake at build time, so changing them needs a redeploy.) |
| Sign-in on prod | Magic link (NOT working yet) + password option (working). Dev password panel is NOT NODE_ENV-gated anymore: it renders on prod as the "Sign in with password" option (intentional, added this session; remove or re-gate post-hackathon). |

---

## Connectors (this Claude session)

| Connector | State |
|---|---|
| `vercel-chris` (Vercel MCP, `https://mcp.vercel.com`) | CONNECTED + verified, bound to the `dogsled` team. Used to drive/verify deploys. Defined in repo-local `.mcp.json` (gitignored). |
| `gh-chris` (GitHub MCP, `https://api.githubcopilot.com/mcp/`) | Did NOT initialize in this app build. Worked around by using plain `git` to push to the web-created repo. Deferred. |
| First-party "GitHub Integration" connector | Connected (powers Projects / remote sessions), separate from `gh-chris`. |

`.mcp.json` (defines `gh-chris`, `vercel-chris`) is gitignored and stays local.

---

## Environment and secrets state

| Item | Value / status |
|---|---|
| Supabase project | `magpie`, ref `tbmdwivhekzfkeidbwia`, region us-east-2 |
| `.env.local` (local dev) | SET: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, `SUPABASE_PROJECT_ID`. Gitignored. |
| `ANTHROPIC_API_KEY` | SET and FUNDED. All AI modes verified live. Routes degrade gracefully (HTTP 402) if the balance hits zero. |
| Dev user | `dogsled@dogsled.dev` (email-confirmed, password set). **Password intentionally not written here anymore (see Security). ROTATE it.** Sign in via the "Sign in with password" option on /login. |
| Supabase Auth URL config | Site URL `https://magpie.wiki`. Redirect URLs: apex `https://magpie.wiki/auth/callback`, `https://hackathon.magpie.wiki/auth/callback`, `http://localhost:3000/auth/callback`. **MISSING the www one** `https://www.magpie.wiki/auth/callback` (add it; the app runs on www). |
| Custom SMTP | NOT configured. Built-in Supabase email is rate-limited; magic link unusable for real signups until SMTP (Resend) is wired. |
| DB password (pooler, admin scripts only) | Was passed through chat in an earlier session and is referenced in git history. Rotate it (Supabase > Settings > Database). |

**Secret hygiene:** the repo is PUBLIC. The dev password and infra identifiers were committed in earlier doc versions and remain in git history. Rotating the dev password and the DB password, and/or making the repo private, is the real remediation.

---

## The auth saga (why magic link is not done, and how to finish it)

Magic link sign-in was the night's hard problem. Resolved understanding:
1. **Env vars were missing from the first prod build** (NEXT_PUBLIC vars bake at build time; they were added after the first deploy). Symptom: the magic-link form hung on "Sending...". FIXED by adding them in Vercel + redeploying. (Also added a try/catch so the form surfaces errors instead of hanging.)
2. **The real gremlin: `magpie.wiki` redirects to `www.magpie.wiki`.** So the app sends `emailRedirectTo = https://www.magpie.wiki/auth/callback`, but only the **apex** callback was in Supabase's allow-list. Supabase fell back to the Site URL (homepage), so the callback never ran and no session was created. Confirmed via Vercel runtime logs (no `/auth/callback` hit; only `GET / -> 307 -> /login`). FIX: add the www callback URL to Supabase redirect URLs.
3. **Email rate limit.** The built-in Supabase email sender throttled after several test sends. FIX: custom SMTP (Resend).

Workaround shipped so Chris can get in now: a **password sign-in option on prod** (`signInWithPassword`, which does not depend on redirect URLs). `dogsled@dogsled.dev` authenticates via password (verified). Next session: do SMTP + the www redirect URL, then verify magic link end to end, then decide whether to keep or remove the password option.

---

## Phase status

| Phase | Title | Status |
|---|---|---|
| 1 | Scaffold + Auth | DONE |
| 2 | Schema + Queries | DONE |
| 3 | Home + Subject Navigation | DONE |
| 4 | {persona} capture (bullets, mic, organize) | DONE |
| 5 | AI modes (Brief, Challenge, Questions, Convo) | DONE |
| 9 | Deploy to magpie.wiki | MOSTLY DONE (live + password login; magic link pending SMTP + www URL) |
| 6 | Facets navigation | NEXT (after hackathon) |
| 7 | Discover + Add Topic | not started |
| 8 | Settings + Polish | not started (note: persona-rename UI lives here; until then "Maggie" default is always correct) |

---

## QA / QC hardening pass (this session)

Ran a thorough multi-pass review (correctness, security, conventions, AI/data layer, plus a UI/responsive pass). Verdict: solid foundation. No catastrophic bugs. RLS is complete and correct on all 9 tables (owner-scoped to `auth.uid()`); no secrets in the client bundle; no service-role key anywhere; model selection + token budgets match `docs/PROMPTS.md`; `ai_cache` has no cross-user leak (topic_id is per-user under RLS); the `angles -> facets` rename is fully carried through (zero stray "angles" in code/schema); no `any`/`console.log`/em dashes in app code.

**Fixed and deployed (`92476ae`), all low-risk:**
- `lib/ai/text-mode.ts`: reroll is now **non-destructive** (no clear-before-call; `setCached` upserts on success), so a failed reroll keeps the old content instead of wiping it. Added a guard against caching an empty model response. The normal (non-reroll) load path is provably unchanged.
- `components/topic/convo-mode.tsx` + `app/api/ai/convo/route.ts`: error-fallback and aria copy now use the persona name (lowercased to keep the casual voice) instead of a hardcoded "Maggie".
- `docs/SOP_SPLIT.md`: removed 6 em dashes (house style).

**Known issues / tech debt (flagged, NOT fixed; none blocking the demo):**
- **[HIGH, post-hackathon] Convo persistence.** On an Anthropic error mid-stream, the server's fallback text ("... hit a snag") gets saved as a real assistant turn and replayed to the model on the next turn; and the user turn is persisted before the reply, so a failure/closed-tab can leave a dangling user turn. Only triggers when the model errors (credits funded, so rare). Fix: persist both turns server-side only on success, and signal errors distinctly so the client does not save them. `app/api/ai/convo/route.ts`, `components/topic/convo-mode.tsx`, `lib/queries/conversations.ts`.
- **[MED] `appendMessage` is a non-atomic read-modify-write** (`lib/queries/conversations.ts`): concurrent appends (multiple tabs, or the planned iMessage front door) can drop a message. Fix: a Postgres `jsonb` append RPC. Matters more once Krava/Linq drive the same conversation.
- **[MED] Seed is not transactional** (`lib/actions/seed-starter-topics.ts`): a concurrent double-trigger could double-seed, and a partial failure (facet unique violation) leaves a half-seeded account. The button disables on pending, which mitigates the common case. Fix: transaction/advisory lock or a `seeded` flag.
- **[MED] Persona capture edges** (`components/topic/persona-mode.tsx`): starting the mic overwrites already-typed input; editing a thought during the brief temp-insert window can lose the edit. Product + timing decisions.
- **[MED, verify when wiring SMTP] Auth callback handles only PKCE `?code=`** (`app/auth/callback/route.ts`). Fine for the current magic-link flow, but confirm the Supabase email template emits `?code=` (not `token_hash`) once SMTP is set.
- **[LOW] Remaining hardcoded "Maggie"** in `components/topic/text-mode.tsx` ("asking maggie...") and `lib/ai/errors.ts` (credit/error copy). These need a `personaName` prop threaded through; only matters once persona-rename ships (Phase 8). Default is always correct today.
- **[LOW] `extractJSON` brace-slice** is fragile and Organize output is not shape-validated (`lib/ai/prompts.ts`, `app/api/ai/organize/route.ts`). Failure mode is a clean "try again", not bad data. Consider coercing missing arrays to `[]`.
- **[LOW] Misnamed component:** `components/auth/dev-sign-in.tsx` / `DevSignIn` is now the production password login. Rename to `password-sign-in.tsx` / `PasswordSignIn` (touches the import in `app/(auth)/login/page.tsx`).
- **[LOW] `as unknown as ConversationMessage[]`** cast repeated in 3 places (topic page, convo route, conversations query). Centralize behind one typed helper.
- **[LOW] Middleware fails open** and does not guard `/api/*` (`middleware.ts`). Today RLS + per-route `requireUser()` cover it. Add a guard if a future non-AI API route (e.g. a Linq webhook) is added, and verify it does its own auth.
- **[LOW] `components/topic/convo-mode.tsx`:** missing final `decoder.decode()` flush after the stream loop; `replaceLast` assumes a non-empty list. Both safe in current usage.

**Second-pass UI / a11y findings (flagged):**
- **Demo polish (judge-facing), worth 10 min before the demo:** the "Add topic" primary button is disabled with no explanation, and the Facets / Discover / Journal bottom tabs are dead. They read as broken to a judge. Cheapest fix (per SOP "Optional polish"): hide them or add "coming soon" tooltips. `app/(main)/page.tsx`, `components/nav/bottom-tab-bar.tsx`.
- **[MED] No `error.tsx` boundary** on the `(main)` routes: a transient Supabase error (the query layer throws) shows the raw Next error screen instead of a styled state. Add a route-level `error.tsx`.
- **[MED] Mic silence auto-stop** can commit an unintended bullet and leave residual text in the input (Web Speech `onend` fires on silence). `components/mic/use-speech-to-text.ts`, `components/topic/persona-mode.tsx`.
- **[LOW] a11y nits:** mode tabs lack tablist/tab ARIA roles; the wordmark image `alt="Magpie"` doubles with the adjacent text for screen readers (use `alt=""` when text shows); some touch targets (facet chips, small timer/delete buttons) are under the 44px guideline.

A second background review pass confirmed the QA fixes above introduced NO regressions (the reroll and persona-copy changes were re-read and verified correct).

(Phase 6/7/12 scaffolding in `lib/ai/prompts.ts`, `lib/seed/bakes/*`, and unused `lib/queries/*` functions is intentional forward-work per CLAUDE.md, not dead code. Leave it.)

---

## Commits this session (4)

```
92476ae  refactor(qa): hardening pass (reroll, persona copy, doc cleanup)
ba82e86  feat(auth): offer password sign-in in production alongside magic link
afb6c99  fix(auth): surface magic-link errors instead of hanging
72021e6  chore: gitignore .mcp.json (local connector config)
67bf741  feat: thread userId through the AI layer (krava-ready)   [session 3 carryover]
```

---

## Session log

### 2026-05-29 (sessions 1 to 3): Phases 1 to 5
Built and verified the full base app (auth, schema + typed query spine, home/subject nav, persona capture with mic + organize, four AI modes with caching + streaming). type-check and prod build green each session. See git history (`db1f977` to `67bf741`).

### 2026-05-30 (session 4): deploy + QA hardening
- Closed the Level 1 identity seam (`67bf741`, carried from session 3 work): `userId` threads through the AI layer (Krava-ready, no Krava import).
- Ran the full local test pass at 375px via the preview tools: capture CRUD persists, all four AI modes (Brief/Challenge/Questions cached + reroll, Convo streamed + persisted), no key leak (verified `/api/ai/*` only, no `api.anthropic.com` from the browser, no key in client chunks), RLS verified static + logged-out redirect + dev password sign-in + session survives refresh. Static RLS check: all 9 tables owner-scoped.
- Connected `vercel-chris` (Vercel MCP) to the dogsled team; `gh-chris` did not initialize, used plain git instead. Fixed the local git author (was Jessica's identity) to Chris for this repo.
- Deployed: created `dogsleddev/magpie` (public), pushed `master`, imported into Vercel on the dogsled team with env vars, attached `magpie.wiki` (apex redirects to www). HTTPS live, app serving.
- Debugged magic link to root cause (see "The auth saga"): missing build-time env vars (fixed), the www-vs-apex redirect allow-list gap (fix pending), and the email rate limit (needs SMTP). Shipped a password sign-in option on prod as the working way in.
- QA hardening pass + safe fixes (`92476ae`); flagged the rest as known issues above.
- type-check clean throughout. Vercel build green on each push.
