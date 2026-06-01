# Magpie · Progress

**Last updated:** 2026-05-31 (session 6: hackathon won; Krava + Linq + demo pages + one-click login; product-phase docs)
**Status:** **WON runner-up + $250** at the Krava × Linq hackathon (May 30, 2026), positive judge feedback (a real product, not a wrapper). Base app **LIVE at https://magpie.wiki**. Now in the **product phase**. Direction + backlog: **`docs/BRD.md`**. Positioning: **`docs/COMPETITORS.md`**. New-session brief: **`HANDOFF.md`**.
**Branch:** `master` (Vercel auto-deploys the latest `master` to magpie.wiki).

This is the living build log. For direction read `docs/BRD.md`; for "what Magpie is," `CLAUDE.md`.

---

## START HERE next session (the post-hackathon sequence)

Read **`HANDOFF.md`** then **`docs/BRD.md`**. Chris's agreed order: **BRD → landing page → UI → the rest.**

1. **BRD / PRD** (done: `docs/BRD.md`) + positioning (`docs/COMPETITORS.md`).
2. **Landing page** + waitlist (scroll-through functionality; `docs/homepage.html` is the reference, build it for real).
3. **UI:** **revert persona to Maggie**, upper-right home nav, edit/delete topics, subtopics, new-user subject/facet onboarding, custom tone, guardrails, the 3D curiosity graph ("shape of your curiosity," per COMPETITORS §3).
4. **The rest:** iPhone app, finish the real Linq inbound loop, verify Krava routes on prod, screenshot-and-converse capture, "where'd you hear it" provenance, social.

**Time-sensitive GTM:** LinkedIn post in ~2 days, Gemini presentation, Loom (BRD §8).
**Security (still deferred):** repo is public, secrets not rotated. Revisit before a wider launch.
**Get in:** magpie.wiki has a one-click **"Enter Magpie"** demo login. Localhost: `npm run dev` (clear `.next` first).

---

## What is live (deployment)

| Item | Value |
|---|---|
| Production URL | https://magpie.wiki (apex 307s to www.magpie.wiki) |
| Build model | Single line: `master` → magpie.wiki, auto-deploy on push. No hackathon branch/subdomain. |
| Vercel / repo | team `dogsled` (`team_i1Es1eTRb83TisgbHEU6gcA5`) / project `magpie` (`prj_Ko7a9i0drxCPWMccMT1yFrlj6ahC`), git-linked to `dogsleddev/magpie` (PUBLIC) |
| Vercel env (Production) | `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`, `ANTHROPIC_API_KEY`, `KRAVA_APP_KEY`, `LINQ_API_TOKEN`, `LINQ_PHONE_NUMBER` (+1 404 384 5892), `LINQ_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` (an `sb_secret_` key). Optional `DEMO_LOGIN_PASSWORD` backstop for the one-click login. |
| Routes | `/`, `/subject/[id]`, `/topic/[id]`, `/facets`, `/facets/[id]`, `/recent`, `/search`, `/login` (one-click), `/auth/callback`, `/krava`, `/linq`, `/api/ai/*`, `/api/linq/webhook` |
| Sign-in | **One-click "Enter Magpie"** (`demoLogin`: passwordless via the service-role key, falls back to `DEMO_LOGIN_PASSWORD`) as `dogsled@dogsled.dev`. Magic link still pending SMTP. |
| Persona | **Decision: product = Magpie, persona = Maggie.** Code currently shows **Magpie** (renamed session 5); **revert to Maggie** in the UI phase (migration default, live `user_settings.persona_name`, threaded `personaName`). `CLAUDE.md` already says Maggie. |
| Krava | Wrapped in `lib/ai/client.ts`, falls back to Anthropic on any error. Local probe confirmed it works; **prod routing unverified.** |
| Linq | Tier 0 webhook live (`/api/linq/webhook`, HMAC). Sandbox is outbound-only, so the **inbound loop is not real**; the demo used a staged thread. `0002_hackathon.sql` applied; phone linked. |
| Demo pages | `/krava` (deck embed + download), `/linq` (iMessage screenshot) |

---

## Session 6 (2026-05-30 to 05-31): hackathon + product-phase docs

- **Krava integration.** `lib/ai/krava.ts` + wrappers route every AI call through Krava's `/api/platform/chat` (verified the SSE `{text}` shape with `scripts/krava-probe.mjs`; functional output good). Hit a prod issue where a Krava 401 was mislabeled as an Anthropic-key error; fixed by making `callClaude`/`streamClaude` **fall back to Anthropic on any runtime Krava error** (not just when the key is absent) and logging the cause. So a Krava hiccup never breaks a mode.
- **Linq Tier 0.** `0002_hackathon.sql` (phone_number, topics.source, conversations.kind, nullable conversations.topic_id, imessage_inbox + RLS), `lib/supabase/admin.ts` (server-only service-role client, since the webhook is unauthenticated), `lib/linq/send.ts` + `lib/linq/store.ts`, `app/api/linq/webhook/route.ts` (HMAC verify, dedupe, Krava-wrapped Convo reply, persist both turns). Outbound confirmed via the Linq sandbox; inbound webhook not wired (sandbox is outbound-only).
- **Demo/submission pages.** `/krava` (Office-viewer deck embed + download, cache-busted) and `/linq` (the iMessage demo screenshot).
- **One-click judge login.** `lib/actions/demo-login.ts` + a single "Enter Magpie" button on `/login` (replaced the magic-link/password forms). Passwordless via service-role, `DEMO_LOGIN_PASSWORD` backstop.
- **Outcome: WON runner-up + $250**, positive feedback.
- **Product-phase docs (this update).** `docs/BRD.md` (requirements + new direction), `docs/COMPETITORS.md` (positioning from the judges' competitor list), `HANDOFF.md` rewritten for the product phase, this PROGRESS rewrite. **Naming locked: Magpie product / Maggie persona** (revert the session-5 code rename).

### Earlier sessions
- **Sessions 1 to 3 (May 29):** built + verified the base app (auth, typed query spine, home/subject nav, persona capture with mic + organize, four AI modes with caching + streaming).
- **Session 4 (May 30):** deployed `master` to magpie.wiki. Debugged magic link to root cause (www-vs-apex redirect gap + email rate limit); shipped a password sign-in. QA hardening pass.
- **Session 5 (May 30):** dropped the split (single `master` line). Shipped Add Topic (talk to the persona, AI-assigned subject + facets, "High Agency" force-filed), search (`/search`), Recent Ideas + inline subject/facet edit (`/recent`), Facets nav (`/facets`), wordmark dot + larger mark, "Remember this topic?". Cleaned docs (SOP_SPLIT superseded, hackathon split reversed).

---

## The auth saga (magic link still pending)

Magic link is not finished (the one-click demo login is the way in now). Root causes: the app runs on `www.magpie.wiki` but only the apex callback is in Supabase's allow-list (add `https://www.magpie.wiki/auth/callback`), and the built-in Supabase email sender throttles (needs custom SMTP, e.g. Resend). When wiring SMTP, confirm the email template emits `?code=` (PKCE), which `app/auth/callback/route.ts` handles.

---

## Phase status

| Phase | Title | Status |
|---|---|---|
| 1 to 5 | Scaffold/Auth, Schema/Queries, Home/Subject nav, persona capture, AI modes | DONE |
| 6 | Facets navigation | BASIC DONE (list + facet detail) |
| 7 | Discover + Add Topic | ADD TOPIC DONE (manual + AI-assist); Discover not started |
| 8 | Settings + Polish | PARTIAL (persona rename UI / settings screen not built; persona revert to Maggie pending) |
| 9 | Deploy to magpie.wiki | DONE (live; magic link pending SMTP) |
| Hackathon | Krava + Linq | Krava wrapped (prod routing to verify); Linq Tier 0 (inbound loop not real, sandbox-limited) |

---

## Known issues / tech debt

- **[HIGH] Krava prod routing unverified.** It may be silently falling back to Anthropic if the Vercel `KRAVA_APP_KEY` is off or the passwordless path errors. Verify via the runtime logs (look for `[krava] ... failed`) before claiming "every call runs through Krava" on prod.
- **[HIGH] Linq inbound loop is not real.** The sandbox is outbound-only; the Tier 0 webhook is untested against real inbound, and the demo thread was staged in the Linq playground. Finishing the real loop is a "the rest" item.
- **[HIGH, pre-existing] Convo persistence on error.** A mid-stream model error saves a fallback line as a real assistant turn; a closed tab can leave a dangling user turn. `app/api/ai/convo/route.ts`, `components/topic/convo-mode.tsx`, `lib/queries/conversations.ts`.
- **[MED] Persona revert pending.** Code shows "Magpie"; the decision is "Maggie."
- **[MED] `appendMessage` is non-atomic** (`lib/queries/conversations.ts`). Matters more now that Linq can drive the same conversation. Fix: a Postgres `jsonb` append RPC.
- **[MED] No `error.tsx`** on `(main)` routes (raw Next error screen on a transient throw). Seed not transactional. Mic capture edges (overwrites typed input).
- **[MED] `demoLogin` passwordless path uses `verifyOtp` type `'email'`** which is unverified against the live API; the `DEMO_LOGIN_PASSWORD` fallback covers it. Confirm or simplify to password-only.
- **[LOW] Add Topic categorization is non-deterministic** (Recent Ideas is the refile safety net). `searchTopics` does not escape LIKE wildcards. `DevSignIn` component is unused now (login is one-click). `extractJSON` is fragile. `as unknown as ConversationMessage[]` cast repeated.
- **Security:** repo public; secrets (incl. the DB password + now the service-role key) live in env. Rotate / private before a wider launch.

---

## Notable commits this session (6)

```
6eb681e  feat: one-click demo login (judges enter as the demo account)
618dc18  feat(linq): show the real Linq sandbox screenshot on /linq
da8b4b5  feat: host the Krava x Linq deck at /krava
bea5903  fix(ai): fall back to Anthropic when Krava errors at runtime
e65c72c  feat: route the AI layer through Krava (fallback-gated)
953f6dd  feat(linq): iMessage webhook Tier 0 (HMAC + Krava-wrapped reply)
```
(Plus the product-phase docs commit for BRD/COMPETITORS/HANDOFF/PROGRESS.)
