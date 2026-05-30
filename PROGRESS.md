# Magpie · Progress

**Last updated:** 2026-05-30 (session 5: hackathon-day feature build + facets)
**Status:** Base app is **LIVE at https://magpie.wiki** and has grown well past the MVP base. This session shipped manual/AI **Add Topic**, **search**, **Recent Ideas** with inline editing, **Facets navigation**, the persona rename to **Magpie**, and brand polish. The **split is abandoned**: `master` is the single build line and the hackathon work lands here. **Krava is next** (see `docs/SOP_KRAVA.md`), then Linq.
**Branch:** `master` (Vercel auto-deploys the latest `master` to magpie.wiki).
**Hackathon:** Krava x Linq, Saturday May 30 2026, Frontier Tower SF.

This is the living "where are we" doc. For "what Magpie is," read `CLAUDE.md`. For the Krava integration runbook, `docs/SOP_KRAVA.md`. For the hackathon plan, `docs/HACKATHON_KRAVA_LINQ.md`.

---

## START HERE next session (ordered)

1. **Krava** (`docs/SOP_KRAVA.md`). Wrap `lib/ai/client.ts` so every AI call routes through Krava, fallback-gated on `KRAVA_APP_KEY` so the demo survives an SDK hiccup. `callClaude`/`streamClaude` already carry `userId`, so this is a one-file change with zero route edits. Lands on `master`, deploys to magpie.wiki.
2. **Linq** (bonus track). Inbound webhook at `app/api/linq/webhook/route.ts` (HMAC verify) + `lib/linq/send.ts` outbound, plus the iMessage inbox. Webhook URL is `https://magpie.wiki/api/linq/webhook` (no subdomain). See `docs/HACKATHON_KRAVA_LINQ.md`.
3. **Magic link for real attendees (optional).** Still pending custom SMTP (Resend) + the `www` callback URL in Supabase. Password sign-in is the working way in and Chris is set to present on it, so this is only needed if outside attendees must sign up. See "The auth saga" below.

**Security (decided):** Chris has chosen NOT to rotate secrets or flip the repo private. He knows the room and accepts the exposure for the event. Do not re-raise it.

To get in right now: **https://magpie.wiki**, expand **"Sign in with password"**, use `dogsled@dogsled.dev` + the password. Localhost: `npm run dev` (clear `.next` first), `http://localhost:3000`, same panel.

---

## What is live (deployment)

| Item | Value |
|---|---|
| Production URL | https://magpie.wiki (HTTPS, valid cert) |
| Apex behavior | `magpie.wiki` **307-redirects to `www.magpie.wiki`** (matters for auth redirect allow-listing) |
| Build model | **Single line.** `master` → magpie.wiki, auto-deploy on push. No `hackathon` branch, no `hackathon.magpie.wiki`. Krava + Linq land on `master`. |
| Vercel team / project | `dogsled` (`team_i1Es1eTRb83TisgbHEU6gcA5`) / `magpie` (`prj_Ko7a9i0drxCPWMccMT1yFrlj6ahC`), git-linked to `dogsleddev/magpie`, Next.js, auto-deploy on push to `master` |
| GitHub repo | `github.com/dogsleddev/magpie` (PUBLIC) |
| Vercel env (Production) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY` (NEXT_PUBLIC vars bake at build time). Krava/Linq will add `KRAVA_APP_KEY`, `LINQ_API_TOKEN`, `LINQ_PHONE_NUMBER`. |
| Routes | `/`, `/subject/[id]`, `/topic/[id]`, `/facets`, `/facets/[id]`, `/recent`, `/search`, `/login`, `/auth/callback`, `/api/ai/*` |
| Persona | Default name is **Magpie** (migration default + the live `user_settings` row). Rename UI is still Phase 8; the default is correct everywhere today. |
| Sign-in | Magic link (NOT finished) + password option (working). The password panel renders on prod intentionally; re-gate or remove post-hackathon. |

---

## Features shipped this session (session 5)

All on `master`, all live on magpie.wiki.

- **Add Topic (talk to Magpie).** `+Add topic` (home + every subject page) opens a dialog; the idea goes through Claude (Haiku) which assigns a subject + facets, then the topic is created and you land on it. **"High Agency" is force-filed** to Psychology & Behavior + `skills`/`challenges` for a deterministic demo. New: `lib/actions/topics.ts` (`addTopicViaMagpie`), `categorizeTopicPrompt` in `lib/ai/prompts.ts`, `components/home/add-topic-dialog.tsx`.
- **Search.** `/search` keyword match over topic titles + facet names, rendered with the shared `TopicList`. `searchTopics` in `lib/queries/topics.ts`, `components/home/topic-search.tsx`.
- **Recent Ideas.** Section at the bottom of the grid → `/recent`, newest-first, with **inline subject reassignment + facet add/remove** (the topic-editing that was missing). `getRecentTopics` + `updateTopicSubject` queries, `moveTopicToSubject`/`updateTopicFacetsByName` actions, `components/recent/recent-ideas-list.tsx`.
- **Facets navigation (Phase 6, basic).** Facets bottom tab is live (no longer greyed): `/facets` lists facets by topic count, `/facets/[id]` shows all topics carrying that facet across subjects. Data layer (`getFacetsWithCounts`, `getTopicsByFacet`) already existed; added `getFacet`.
- **Persona rename Maggie → Magpie.** Single-sourced from `user_settings.persona_name`; threaded through `TextMode`; error copy updated; migration default changed.
- **Brand + copy.** Wordmark mark enlarged (correct aspect, was squashed) with the teal shiny dot after the word. "Convo Roulette" relabeled **"Remember this topic?"**.
- **Polish.** `/facets` revalidation on add/move/facet-edit; facet-name lowercase dedupe; Add Topic modal gets Escape-to-close + `role="dialog"`.

---

## The auth saga (magic link still pending)

Magic link is not finished. Root causes (from session 4):
1. **www-vs-apex redirect gap.** The app runs on `www.magpie.wiki`, so `emailRedirectTo` is the www callback, but only the apex callback is in Supabase's allow-list. Fix: add `https://www.magpie.wiki/auth/callback` to Supabase > Authentication > URL Configuration.
2. **Email rate limit.** The built-in Supabase sender throttles. Fix: custom SMTP (Resend free tier) in Supabase > Authentication > SMTP Settings.
Then send one fresh link and confirm it lands on the grid. Until then, password sign-in (`signInWithPassword`, no redirect dependency) is the working way in. When wiring SMTP, confirm the email template emits `?code=` (PKCE), which `app/auth/callback/route.ts` handles.

---

## Phase status

| Phase | Title | Status |
|---|---|---|
| 1 | Scaffold + Auth | DONE |
| 2 | Schema + Queries | DONE |
| 3 | Home + Subject Navigation | DONE |
| 4 | {persona} capture (bullets, mic, organize) | DONE |
| 5 | AI modes (Brief, Challenge, Questions, Convo) | DONE |
| 6 | Facets navigation | BASIC DONE (list + facet detail; no facet-filtered cross views beyond this) |
| 7 | Discover + Add Topic | ADD TOPIC DONE (manual + AI-assist); Discover not started |
| 8 | Settings + Polish | PARTIAL (persona is Magpie by default; rename UI / settings screen not built) |
| 9 | Deploy to magpie.wiki | DONE (live; magic link still pending SMTP + www URL) |

---

## Known issues / tech debt (flagged, not blocking the demo)

- **[HIGH, post-hackathon] Convo persistence.** On an Anthropic error mid-stream, the fallback text gets saved as a real assistant turn and replayed; the user turn is persisted before the reply, so a failure/closed-tab can leave a dangling user turn. Only triggers on model error. `app/api/ai/convo/route.ts`, `components/topic/convo-mode.tsx`, `lib/queries/conversations.ts`.
- **[MED] `appendMessage` is non-atomic** (`lib/queries/conversations.ts`): concurrent appends can drop a message. Matters once Linq drives the same conversation. Fix: a Postgres `jsonb` append RPC.
- **[MED] Seed is not transactional** (`lib/actions/seed-starter-topics.ts`). The pending-disable mitigates the common case.
- **[MED] Persona capture edges** (`components/topic/persona-mode.tsx`): starting the mic overwrites typed input; mic silence auto-stop can commit a stray bullet.
- **[MED] No `error.tsx`** on `(main)` routes: a transient query throw shows the raw Next error screen.
- **[LOW] Add Topic AI categorization is non-deterministic** for inputs other than "High Agency" (subject/facets are model-chosen). Recent Ideas is the safety net to refile. `lib/actions/topics.ts`.
- **[LOW] `searchTopics` does not escape LIKE wildcards** (`%`, `_`) in the query. Harmless for normal words.
- **[LOW] Misnamed component:** `components/auth/dev-sign-in.tsx` / `DevSignIn` is the production password login. Rename to `password-sign-in.tsx`.
- **[LOW] `extractJSON` brace-slice** is fragile and Organize/categorize output is not shape-validated. Failure mode is a clean "try again", not bad data.
- **[LOW] Middleware fails open** and does not guard `/api/*`. Add a guard before the Linq webhook ships, and verify the webhook does its own auth (HMAC).
- **[LOW] `as unknown as ConversationMessage[]`** cast repeated in 3 places.

(Resolved this session: the hardcoded "Maggie" in `text-mode.tsx` and `errors.ts` is gone; persona is threaded/renamed.)

(Phase 5.5 / 9.5+ scaffolding in `lib/ai/prompts.ts`, `lib/seed/bakes/*`, and unused `lib/queries/*` is intentional forward-work per CLAUDE.md, not dead code.)

---

## Commits this session (5)

```
0712468  refactor: facets revalidation, facet-name dedupe, modal a11y polish
5c5615b  feat(facets): activate Facets nav (list + facet detail)
b3d744d  feat: talk-to-Magpie add, search, recent ideas, persona rename, brand dot
9a8f4a8  docs: update PROGRESS for deploy + QA state, add SOP_SPLIT status note   [session 4]
78bdf05  polish: mute disabled Add topic button                                   [session 4]
```

---

## Session log

### 2026-05-29 (sessions 1 to 3): Phases 1 to 5
Built and verified the full base app (auth, typed query spine, home/subject nav, persona capture with mic + organize, four AI modes with caching + streaming).

### 2026-05-30 (session 4): deploy + QA hardening
Deployed `master` to magpie.wiki (Vercel, dogsled team, public repo). Debugged magic link to root cause (www redirect gap + email rate limit), shipped password sign-in as the working way in. QA hardening pass + safe fixes.

### 2026-05-30 (session 5): hackathon-day feature build
- **Pivot:** dropped the split. `master` is the single build line; everything (incl. Krava/Linq) ships to magpie.wiki. Security rotation declined by Chris (knows the room).
- Shipped Add Topic (manual + AI-assist via Magpie, High Agency forced), search, Recent Ideas with inline subject/facet editing, Facets navigation (Phase 6 basic), persona rename to Magpie, wordmark dot + larger mark, "Remember this topic?".
- Code review pass: revalidate `/facets`, facet-name dedupe, modal a11y.
- type-check + clean prod build green on each push; deploys verified live by polling the production domain.
- Docs cleaned (this update), `docs/SOP_SPLIT.md` marked superseded, `docs/HACKATHON_KRAVA_LINQ.md` split decision reversed. `docs/SOP_KRAVA.md` added for the next session.
