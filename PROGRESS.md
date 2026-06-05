# Magpie · Progress

**Last updated:** 2026-06-04 (the Nest + community launch + a full iteration pass, all committed and deployed to prod)
**Status:** **LIVE at https://magpie.wiki** with the Nest mind map, the community shared-account model, and this session's iteration (desktop Nest, Rediscover, landing polish, Sports, facet links, Maggie's AI opener, delete-topic, an iOS mic fix, a two-pass QC pass). Won runner-up + $250 at the Krava × Linq hackathon (May 30, 2026). Direction + backlog: **`docs/BRD.md`**. Positioning: **`docs/COMPETITORS.md`**. New-session brief: **`HANDOFF.md`**. Nest detail: **`docs/NEST.md`**.
**Branch:** `master` (Vercel auto-deploys the latest `master` to magpie.wiki).

This is the living build log. For direction read `docs/BRD.md`; for "what Magpie is," `CLAUDE.md`.

---

## START HERE next session

The landing page, the **Nest**, and the **community shared-account** launch all shipped and are live. Read **`CLAUDE.md` (Current status)** then **`docs/NEST.md`**.

**First, the one open bug: speech-to-text on iPhone.** The mic pulses but text was not arriving. The continuous-mode fix shipped (`components/mic/use-speech-to-text.ts`, now `continuous = false` + auto-restart), and the mic now shows its error on-screen. If it is still broken, the prime suspects are **iOS Dictation off** (Settings > General > Keyboard > Enable Dictation) and **Safari mic permission**. Get the on-screen error text from Chris's phone to pinpoint it. Next code lever if needed: a user-gesture-aware restart, or guiding iOS users to the keyboard's own dictation mic.

**QC backlog (from the two-pass review, none blocking):**

- Cache the Convo opener server-side (ai_cache + TTL) instead of the current in-memory cache, to kill the per-open Haiku call across reloads.
- Reconcile the `default_mode` enum: the DB allows `convo`, the UI uses `thoughts` (`mode-tabs.tsx` vs `0001_init.sql`). Align before any settings UI writes it.
- The node-detail popover does not re-clamp on window resize (`nest-desktop-view.tsx`).
- Decide whether the AI opener should persist into the saved transcript (today it is display-only).
- Remove the dev backfill routes (`/api/dev/backfill-sports`, `/api/dev/backfill-red-rising`) now that they have run (they 403 in prod but ship in the bundle).

**Bigger product backlog (`docs/BRD.md`):** per-user private accounts (post-waitlist), Glints, Draw Out, the real Linq inbound loop, verify Krava routes on prod, screenshot-and-converse capture, iPhone app.
**Security (still deferred):** repo is public; migrate the Supabase `service_role` value to an `sb_secret_` key before end of 2026.
**Get in:** magpie.wiki has a one-click **"Enter Magpie"** community login. Localhost: `npm run dev` (clear `.next` first; OneDrive corrupts stale `.next`).

---

## What is live (deployment)

| Item                    | Value                                                                                                                                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Production URL          | https://magpie.wiki (apex 307s to www.magpie.wiki)                                                                                                                                                                                                                             |
| Build model             | Single line: `master` → magpie.wiki, auto-deploy on push. No hackathon branch/subdomain.                                                                                                                                                                                       |
| Vercel / repo           | team `dogsled` (`team_i1Es1eTRb83TisgbHEU6gcA5`) / project `magpie` (`prj_Ko7a9i0drxCPWMccMT1yFrlj6ahC`), git-linked to `dogsleddev/magpie` (PUBLIC)                                                                                                                           |
| Vercel env (Production) | `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`, `ANTHROPIC_API_KEY`, `KRAVA_APP_KEY`, `LINQ_API_TOKEN`, `LINQ_PHONE_NUMBER` (+1 404 384 5892), `LINQ_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` (an `sb_secret_` key). Optional `DEMO_LOGIN_PASSWORD` backstop for the one-click login. |
| Routes                  | `/`, `/app` (grid), `/subject/[id]`, `/topic/[id]`, `/nest`, `/facets`, `/facets/[id]`, `/recent`, `/search`, `/login`, `/auth/callback`, `/krava`, `/linq`, `/api/ai/*` (incl. `convo-opener`), `/api/dev/backfill-*` (dev-only), `/api/linq/webhook`                         |
| Sign-in                 | **One-click "Enter Magpie"** (`demoLogin`: passwordless via the service-role key, falls back to `DEMO_LOGIN_PASSWORD`) as `dogsled@dogsled.dev`. Magic link still pending SMTP.                                                                                                |
| Persona                 | **Settled: product = Magpie, persona = Maggie** (live). The default `user_settings.persona_name` plus the threaded `personaName`; renameable in settings.                                                                                                                      |
| Krava                   | Wrapped in `lib/ai/client.ts`, falls back to Anthropic on any error. Local probe confirmed it works; **prod routing unverified.**                                                                                                                                              |
| Linq                    | Tier 0 webhook live (`/api/linq/webhook`, HMAC). Sandbox is outbound-only, so the **inbound loop is not real**; the demo used a staged thread. `0002_hackathon.sql` applied; phone linked.                                                                                     |
| Demo pages              | `/krava` (deck embed + download), `/linq` (iMessage screenshot)                                                                                                                                                                                                                |

---

## Sessions 8 to 9 (2026-06-02 to 06-04): the Nest, the community launch, the iteration + QC

**The Nest** (replaced the Journal tab). A force-directed d3-force constellation of the whole wiki: Subject -> Topic -> Sub-topic containment, the cross-subject Facet web (Bridge/Threads lens), and emergent Resonance. Pure graph layer in `lib/nest/` (single-source `buildNestGraph`), RLS-scoped source in `lib/queries/nest.ts`, the canvas island in `components/nest/`. Live at `/nest`, embedded on the landing, plus standalone reference HTML. Built + reviewed twice in a prior session, then committed + deployed here. Architecture: `docs/NEST.md`.

**Community launch.** Shared-account model: everyone enters `dogsled@dogsled.dev` via "Enter Magpie" and grows one shared grid + Nest. Per-user private accounts deferred (RLS + seed-on-first-login already support them).

**The iteration (all on `master`, deployed):**

- **Desktop Nest** (`nest-desktop-view.tsx`): a full-screen overlay opened by a "Desktop" button on the Nest tab, modeled on `nest-portable.html` (now at the repo root). Docked control panel (Bridge/Threads/Off, Resonance, Labels, Living drift, Repel/Link sliders, subject legend, facet chips, reset, stats), full-bleed canvas, detail popover. New `nest-canvas` props: `externalHighlight` (panel chip / legend light-up) and `subjectsOutside` (radial force pushes subjects to the rim).
- **Landing:** the Nest moved up to a showcase above "How it works", restyled like the desktop view and settling to a static frame. Hero reordered to Add a Curiosity / See the community nest (new, `goNest` demoLogin -> `/nest`) / Join the waitlist. Heading: "See your nest of curiosities as a constellation." Wordmark dot is a baseline teal period, 10% bigger.
- **Rediscover:** the bottom-bar Discover tab spins to a random topic (server action over `spinRandomTopic`).
- **Maggie opener:** the Convo greeting is a short, personal, per-topic AI question (`/api/ai/convo-opener`, Haiku), with an in-memory cache + a fallback line.
- **Topic page:** facet chips link to `/facets/[id]`; a quiet "delete topic" control (inline confirm, cascade-safe via the schema FKs).
- **Sports** subject added to the seed (Seattle/Bay Area teams, the Winter Olympics, etc.) and to the live community account via `GET /api/dev/backfill-sports` (dev-only, idempotent).
- **Speech-to-text iOS fix:** `continuous = false` + auto-restart (iOS keeps a continuous session live but never returns results). The mic now also surfaces its error on-screen for diagnosis. **Still being chased on iPhone (see START HERE).**
- **Two-pass QC hardening:** abort the Convo stream when the user leaves the view (no more persisting a walked-away answer), always release dragged Nest nodes (drift used to pin them), `requireUser()` on delete/move/facet actions, revalidate `/topic` + `/nest`, removed the dead `appendMessage`.

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

| Phase     | Title                                                                      | Status                                                                                       |
| --------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1 to 5    | Scaffold/Auth, Schema/Queries, Home/Subject nav, persona capture, AI modes | DONE                                                                                         |
| 6         | Facets navigation                                                          | BASIC DONE (list + facet detail)                                                             |
| 7         | Discover + Add Topic                                                       | ADD TOPIC DONE (manual + AI-assist); Discover not started                                    |
| 8         | Settings + Polish                                                          | PARTIAL (persona rename UI / settings screen not built; persona revert to Maggie pending)    |
| 9         | Deploy to magpie.wiki                                                      | DONE (live; magic link pending SMTP)                                                         |
| Hackathon | Krava + Linq                                                               | Krava wrapped (prod routing to verify); Linq Tier 0 (inbound loop not real, sandbox-limited) |

---

## Known issues / tech debt

- **[OPEN, active] Speech-to-text on iPhone.** The mic pulses but text was not landing. The `continuous = false` + auto-restart fix shipped and the mic now surfaces its error on-screen. Prime suspects if still broken: iOS Dictation off (Settings > General > Keyboard), Safari mic permission. See START HERE. `components/mic/use-speech-to-text.ts`.
- **[HIGH] Krava prod routing unverified.** It may be silently falling back to Anthropic if the Vercel `KRAVA_APP_KEY` is off or the passwordless path errors. Verify via the runtime logs (look for `[krava] ... failed`) before claiming "every call runs through Krava" on prod.
- **[HIGH] Linq inbound loop is not real.** The sandbox is outbound-only; the Tier 0 webhook is untested against real inbound, and the demo thread was staged in the Linq playground. Finishing the real loop is a "the rest" item.
- **[RESOLVED] Convo persistence on error/leave.** Mid-stream error notes are marked and never persisted (`CONVO_STREAM_ERROR_MARK`); and as of the QC pass, leaving the view aborts the stream so a half-finished or walked-away answer is never saved (`components/topic/convo-mode.tsx`).
- **[MED] Persona revert pending.** Code shows "Magpie"; the decision is "Maggie."
- **[MED] Conversation writes are non-atomic.** `appendMessages` (`lib/queries/conversations.ts`) is read-modify-write; two writers on the same topic (the app plus a Linq inbound turn) can clobber. Fix: a Postgres `jsonb` append RPC. (The unused single-turn `appendMessage` was removed in the QC pass.)
- **[MED] No `error.tsx`** on `(main)` routes (raw Next error screen on a transient throw). Seed not transactional. Mic capture edges (overwrites typed input).
- **[MED] `demoLogin` passwordless path uses `verifyOtp` type `'email'`** which is unverified against the live API; the `DEMO_LOGIN_PASSWORD` fallback covers it. Confirm or simplify to password-only.
- **[LOW] Add Topic categorization is non-deterministic** (Recent Ideas is the refile safety net). `extractJSON` is fragile. `as unknown as ConversationMessage[]` cast repeated. (Session 7 QC: `searchTopics` LIKE-wildcard escaping fixed; dead `DevSignIn` + `MagicLinkForm` auth forms removed.)
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
