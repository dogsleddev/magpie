# Magpie · Progress

**Last updated:** 2026-06-09 (session 12: group drilldown UI, Nest full-bleed on mobile, full UX review, launch polish, og-nest.png shipped)
**Status:** **LIVE at https://magpie.wiki** with the Nest mind map, entity groups with a real drilldown UI, the umbrella auto-group feature on Add Topic, the post-UX-review landing, and a working LinkedIn link-preview card. Won runner-up + $250 at the Krava × Linq hackathon (May 30, 2026). Direction + backlog: **`docs/BRD.md`**. Positioning: **`docs/COMPETITORS.md`**. New-session brief: **`HANDOFF.md`**. Nest detail: **`docs/NEST.md`**.
**Branch:** `master` (Vercel auto-deploys the latest `master` to magpie.wiki).

This is the living build log. For direction read `docs/BRD.md`; for "what Magpie is," `CLAUDE.md`.

---

## START HERE next session

**Session 12 shipped:** the group drilldown UI (Red Rising behaves like a folder now), the Nest opening full-bleed on every viewport, a full UX review of every screen, the launch polish that came out of it, and the missing `og-nest.png`. All on `master`, all verified in prod. Read **`CLAUDE.md` (Current status)**, then this block.

**Immediate launch tasks:**

- **Post the LinkedIn announcement.** Draft + reviewer prompt in `docs/LINKEDIN_LAUNCH.md`. The og image is DONE and serving on prod, so the link card works. Still needs: the **people to tag** (@handles for Krava, Linq, the judges). A 6-to-10s screen-recording of the Nest beats a still in the post body; put the magpie.wiki link in the first comment, LinkedIn throttles in-body links.
- **Test on Chris's iPhone:** the keyboard-dictation mic hint (`components/mic/is-ios.ts`) AND the new mobile Nest default (full-bleed view, collapsed panel, exit button). Both live, neither verified on-device.
- **Curate the duplicate community topics.** Confirmed pair: "How did the reintroduction of wolves change Yellowstone's entire ecosystem?" and "Why wolves changed the path of rivers in Yellowstone" (both Wildlife). Audit all titles, propose a merge list to Chris BEFORE deleting (topics carry thoughts/conversations/facets; deletes cascade). Pattern reference: `scripts/group-backfill.mjs`.

**Privacy (do not overclaim).** Krava is **Level-1 only**: inference TEE routing, app-key based. Stored data is **plaintext Supabase**, identity-decoupling skipped, falls back to Anthropic on any error, prod routing unverified. Privacy stays off the site; the post frames it as hackathon theme only.

**Umbrella check (shipped, not yet verified on prod).** Every Add Topic now runs `applyUmbrella()` in `lib/actions/topics.ts`. Test: log into the community account, add a new Seahawks-adjacent topic, confirm it lands under the Seattle Seahawks group parent. The check is conservative (never creates a group of one) and failures never block the add. **Session 12 guard:** an add made from a group page (explicit `parentTopicId`) skips the umbrella entirely; the user's placement wins.

**Carryover QC backlog (none blocking):** cache the Convo opener server-side; reconcile the `default_mode` enum (`mode-tabs.tsx` vs `0001_init.sql`); Nest node-popover does not re-clamp on resize (`nest-desktop-view.tsx`); decide if the opener persists; remove the dev backfill routes (`/api/dev/backfill-*`). The "Yours to keep" card promises **export is coming** (not built), so build or soften.

**Bigger product backlog (`docs/BRD.md`):** individual accounts + community mode, new-user onboarding, custom tone/personality + guardrails, the real Linq inbound loop, the iPhone app.
**Security (deferred):** repo is public; migrate the Supabase `service_role` value to an `sb_secret_` key before end of 2026.
**Get in:** magpie.wiki one-click **"Enter Magpie"** community login. Localhost: `npm run dev` (clear `.next` first; OneDrive corrupts stale `.next`).

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

## Session 12 (2026-06-09): group drilldown, Nest on mobile, UX review, launch polish, og image

**Group drilldown UI (`c54d084`, live).** Chris's report: clicking Red Rising in Books opened it like a normal topic with the sub-topics flat in the same list. Assessment first: **zero schema/architecture change needed**, `is_group` + `parent_topic_id` were already live and populated. The fix was presentation only:
- `components/subject/subject-topics.tsx`: a sub-topic hides behind its group's row only when that group is in the rendered list (so the same component renders a group's children on the group page). Group rows get a teal Layers icon + "N sub-topics inside"; facet chips count only visible rows.
- `app/(main)/topic/[id]/page.tsx`: branches on `is_group`. A group renders as a collection page (meta editor, "a collection · N sub-topics", Add a sub-topic, the children list, delete-collection) instead of mode tabs. Child topics back-link to their parent group (new `parent:parent_topic_id(id,title)` self-embed on `getTopic`).
- `getChildTopics()` added to `lib/queries/topics.ts`. `AddTopicDialog` takes `parentTopicId` + `triggerLabel`; `addTopicViaMagpie` threads `parentTopicId` to `createTopic`. `DeleteTopic` warns "delete this collection and every sub-topic in it?" for groups (FK cascades).

**Umbrella guard (`1a528e1`).** Found while rebasing onto session 11's umbrella check: `applyUmbrella` could re-parent a sub-topic the user had just explicitly filed into a group (it unshifts the new topic into the adoption list unconditionally). Now an explicit `parentTopicId` skips the umbrella; the user's placement wins.

**Nest full-bleed everywhere (`ba01399`, live).** The Nest tab opens straight into the desktop overlay on every viewport, phones included (supersedes session 11's >=1024px-only default). On small screens the control panel starts collapsed so the constellation fills the 375px frame, and the hint copy covers touch ("pinch or scroll... tap a node"). Exit still drops to the compact view and sticks for the visit.

**Full UX review (no-code pass, then fixes).** Drove every screen at 375px + 1280px against live data: Rediscover, the AI opener, Brief, Thoughts, Facets + detail, search, the drilldown loop, the Nest, the landing, both demo CTAs, the waitlist form states. Verdict: the landing balance is GOOD (~870 words), do not re-grow it. Findings that did NOT get fixed this session: near-duplicate community topics (see START HERE), the in-app waitlist link exits to the landing (modal idea, post-launch), no settings surface (correct for shared mode), `/krava` + `/linq` are public-but-unlinked (fine).

**Launch polish from the review (`77381fb`, all live):**
- Hero trimmed to **two CTAs**: "See the community nest" (primary) + "Add a curiosity" (secondary). The redundant "See the community topics" button is gone (a cold visitor cannot distinguish nest vs topics).
- **Inline waitlist form restored** under the "150+ curiosities" count band (the visual peak), alongside the bottom `#join` block.
- **Why-grid cut 6 -> 3** to the trust trio (Pull never push / No ads. Ever. / Yours to keep); the cut cards repeated the modes section.
- **"Add a curiosity" everywhere:** the dialog title + aria, the home/subject triggers, and the hero all share the landing language (the group page keeps "Add a sub-topic").
- **Welcome hint dismissal persists** for a year via the `magpie_hint_dismissed` cookie. Gotcha fixed along the way: the cookie-name constant exported from the `'use client'` module became a client-reference proxy when the server page imported it (lookup silently never matched). It lives in `components/home/welcome-hint-cookie.ts` (plain module) now.
- **`public/brand/og-nest.png` exists** (172 KB, 1200x630): a deterministic generated constellation in the plumage palette (subjects on the rim, woven interior, wordmark + tagline + "The community nest is growing at magpie.wiki"). Generator checked in at `scripts/generate-og-nest.mjs` (seeded, re-run anytime). Verified 200 on prod; the LinkedIn card is unblocked.

**Ops notes:** local git needed `git config windows.appendAtomically false` to commit (OneDrive append quirk; set in repo config). PowerShell 5.1 mangles embedded double quotes in `git commit -m` here-strings; avoid quotes in commit messages.

**Commits:** `c54d084` (group drilldown), `ba01399` (Nest full-bleed), `1a528e1` (umbrella guard), `77381fb` (launch polish + og image).

---

## Session 11 (2026-06-09): entity groups, umbrella check, homepage QC, Nest desktop default

**Entity groups on prod (live).** Red Rising and Corvids are now proper group topics on the community DB. A one-time `scripts/group-backfill.mjs` script ran against prod (service-role, idempotent, `--write` flag): created the Red Rising group anchor, reparented three child topics (Ender's Game comparison, political structure, golds/reds caste), created the Corvids group, reparented three children (mirror test, raven funerals, crows give gifts), and deleted the now-redundant `red rising` facet. Result: 159 topics, 17 facets, 2 `is_group` anchors. Probe scripts retained at `scripts/group-backfill.mjs`, `scripts/red-rising-probe.mjs`, `scripts/topic-dump.mjs`.

**Umbrella check (shipped, `34ac109`).** Every `addTopicViaMagpie()` call now runs an entity-grouping pass after topic creation:
- `categorizeTopicPrompt` in `lib/ai/prompts.ts` receives the full existing topic list (up to 400) and returns an optional `group: { name, members }` when the new topic shares a named entity (series, team, show, franchise) with existing topics. Themes and genres are explicitly excluded (those are facets).
- `applyUmbrella()` in `lib/actions/topics.ts` handles the full resolve: finds an existing group parent by entity name (preferring an `is_group` anchor), or promotes an existing topic to group, or creates a new group topic. Children are adopted under the parent with their `subject_id` following the parent. Conservative: if there is no existing parent AND no sibling matches, it returns null and skips grouping. Failures are caught and logged; they never block the add.
- `getTopicsLite()`, `promoteTopicToGroup()`, `adoptTopicsUnderGroup()` added to `lib/queries/topics.ts`.
- `lib/seed/starter-topics.ts` updated: Corvids group + its three children added with `parentTitle`, `red rising` facet removed from all Red Rising seed topics.

**Homepage QC pass (`28329f6`, `92d3450`, `78de38d`, all live):**
- Nav CTA was greyed out from a CSS specificity collision (`.navlinks a` overrode `.navcta`). Fixed by narrowing to `.navlinks a.navcta`, removed `!important` on hover.
- Hero sub-line changed to "Visualize connections in the nest." (no "the"). Hero CTA button order: **See the community nest** (btn-primary, first/highlighted) -> Add a Curiosity -> See the community topics.
- "See the community topics" replaced the old "Join the waitlist" third button (now a `demoLogin` form action routing to `/app`, not an anchor).
- Five-modes section fully rewritten to match the real app tabs (Maggie = AI opener + riff partner; Thoughts = bullet capture; Brief, Challenge, Questions accurate).
- Maggie card trimmed (removed the "never starts with 'Great question!'" clause).
- Nest section eyebrow: "The Community Nest" -> "The Nest". Waitlist form removed from the nest-cta-band.

**Nest desktop default (`6d0ea53`, live).** On viewports >=1024px, the Nest page now opens in Desktop overlay mode automatically. SSR-safe: implemented as a `useEffect` mount check on `window.matchMedia('(min-width: 1024px)').matches` in `components/nest/nest-view.tsx`, so the initial render matches the server and hydration is clean.

**Commits:** `6d0ea53` (Nest desktop default), `28329f6` (nav CTA + homepage), `92d3450` (hero waitlist->community topics), `78de38d` (hero polish + Maggie card), `34ac109` (umbrella check + entity groups).

---

## Session 10 (2026-06-04 to 06-05): LinkedIn launch prep + landing relaunch

A launch-focused pass to get magpie.wiki ready for the LinkedIn announcement.

**Landing relaunch (all live on `master`):**

- **Community Nest leads the page.** Moved the constellation showcase directly under the hero (first thing on scroll). Positioning locked: **community is the hook, the personal/memory/privacy moat stays** (the hero sub stayed "a personal wiki..."; only the Nest section and the new hero CTA went community). Eyebrow "The Community Nest", title "See the community's curiosities as a living constellation".
- **Inline waitlist capture** plus a social-proof line ("150+ curiosities across 15 subjects, and growing", hardcoded from a real count of 157/15 via `scripts/community-stats.mjs`) directly under the constellation, so the email is caught at the visual peak, not only at the page bottom.
- **Hero CTA** "Join the waitlist and build your own community nest" (teal-accented subhead above the buttons). Wordmark dot bumped 10% again.
- **"Coming soon" badges** on Glints and Draw Out (both featured but unbuilt). Trust card "Yours, exportable" -> **"Yours to keep"** / "Export is coming" (export is not built).
- **og:image + twitter card metadata** wired (`app/page.tsx`) pointing at `/brand/og-nest.png`. **That image file does not exist yet** (the agent cannot write a binary), so the card has no image until Chris drops a 1200x630 constellation screenshot there.
- **In-app header CTA:** a right-aligned "Join the waitlist" button added to the AppBar (`components/nav/app-bar.tsx`), shown on every in-app page, linking to `/#join`, so nest explorers can convert.
- **Contact -> LinkedIn:** the two footer contact links (`hello@magpie.wiki`) now point to `linkedin.com/in/dougherty4` as "ask Chris" / "Chris".

**iOS mic, resolved differently.** The session-9 continuous-restart fix did not work on iPhone (Chris's test: iOS Chrome captured one word, Dictation was ON, so it is a WebKit stub, not a permission/Dictation problem). New approach, **live**: `components/mic/is-ios.ts` exports `isIOS()` (+ a hydration-safe `useIsIOS()`); the hook reports `supported: false` on iOS; `persona-mode` + `convo-mode` hide the mic on iOS and show a "tap the mic on your keyboard" hint. Desktop/Android Web Speech untouched. **Locked decision, do not re-diagnose** (project memory written). Still needs an on-device look.

**Waitlist verified.** Table + action + form work end-to-end on prod (a live-form test email landed). Reads are dashboard/service-role only by RLS design. Cleaned the `verify+%` probe rows. Added `scripts/community-stats.mjs`.

**Krava privacy, analyzed from the code** (for the post): app-key based (no user key needed) but **Level-1 only** (inference TEE routing). Stored data is plaintext Supabase, PasskeyID/identity-decoupling was skipped, and it falls back to Anthropic on any error; prod routing unverified. Conclusion: **privacy stays off the site**; the post mentions it as the hackathon theme only.

**LinkedIn post drafted** (privacy-led hook, runner-up, honest privacy framing, placeholders for the people to tag) plus a reusable reviewer prompt. Carried forward in the next-session prompt.

**Commits:** `cb6c602` (iOS mic), `2deaa43` (landing launch pass), `e75f15c` (in-app waitlist CTA + contact -> LinkedIn).

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
