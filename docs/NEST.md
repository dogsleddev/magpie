# Nest View

The **Nest** is Magpie's mind map: a force-directed constellation of the user's whole wiki. It **replaced the Journal tab**. Instead of a flat list of thoughts, it's the reflective overview surface where the interrelationships between topics and facets are visible, and node size reflects thought density.

This is the realized version of the old "Nest View" (Phase 11) concept and the static dot-mockup that used to sit on the landing page.

---

## The three dimensions (the data model, as a graph)

**4 node types:** `subject`, `topic`, `subtopic`, `facet`.

**3 edge kinds (the three dimensions):**
1. **Containment** (the spine): Subject -> Topic -> Sub-topic. Structural.
2. **Facet** (the cross-subject web): toggleable between **bridge** (a facet is its own node linked to every tagged topic) and **thread** (faint necklaces directly between co-tagged topics, no facet node).
3. **Resonance** (emergent, derived): faint Topic <-> Topic when two topics share >= 2 facets. No schema change; this is the "adjacent topics surface" promise.

**Node size:** thought count; degrades gracefully to facet-degree when thoughts are 0.
**Color:** an iridescent teal -> blue -> purple ramp from the plumage palette, one hue per subject.

---

## Architecture (file map)

**Pure graph layer (`lib/nest/`):**
- `types.ts` - `NestSource`, `NestNode`, `NestLink`, `NestGraph`, `NestBuildOptions`.
- `build-graph.ts` - `buildNestGraph(source, { facetMode, resonance })` -> `{ nodes, links }`. **The single source of graph construction**, shared by the app and the landing. Pure/isomorphic. Final step filters links to only those whose endpoints exist as nodes (crash-proof against orphaned refs).
- `from-seed.ts` - `fromSeed(STARTER_PACK)` -> `NestSource` for the public landing (synthesizes stable slug ids).

**Query (`lib/queries/nest.ts`):**
- `getNestGraph()` -> `NestSource` for the signed-in user: subjects, topics (with subject_id, is_group, parent_topic_id, facet ids, thought count via `thoughts(count)`), facets. RLS-scoped. **Never call from the public landing path.**

**Components (`components/nest/`):**
- `nest-canvas.tsx` - `'use client'` island: d3-force sim + HTML canvas + pointer pan/zoom/tap/focus. DPR-aware, preserves node positions across facet-mode toggles, settles and stops ticking (battery) unless `ambient`. All DOM work is in a `useEffect` so it SSRs safely with no `next/dynamic`.
- `nest-view.tsx` - `'use client'` app wrapper: Bridge/Threads + Resonance/Labels controls, and a tap-a-topic detail card that routes to `/topic/[id]`.
- `nest-embed.tsx` - `'use client'` landing embed: seed data, thread mode, ambient drift, non-interactive, honors `prefers-reduced-motion`.

**Page + nav:**
- `app/(main)/nest/page.tsx` - server page: `getNestGraph()` -> `NestView`, with an empty-state guard.
- `components/nav/bottom-tab-bar.tsx` - the **Nest** tab (Waypoints icon) replaced Journal; `lib/supabase/middleware.ts` protects `/nest`.

**Dependency:** `d3-force` (+ `@types/d3-force`). Physics only; rendering is a custom canvas. No `react-force-graph`.

---

## Surfaces

1. **In-app `/nest`** (Nest tab) - live user/community data.
2. **Landing embed** (`app/page.tsx`, replaced the static dot mockup; dead CSS removed from `app/landing.css`) - seed data.
3. **Standalone reference HTML in `docs/`:**
   - `nest-portable.html` - fully self-contained (d3 inlined, classic script), opens via `file://`, works offline. Share/email-able.
   - `nest-prototype.html` - the responsive interactive prototype (served via the docs preview server, pulls d3 from CDN).
   - `nest-desktop.html` - a **desktop-locked reference** snapshot. The eventual in-app desktop layout should match this; the mobile in-app version will diverge.

The docs preview server: `node scripts/serve-docs.mjs` (or the `docs` launch config) -> http://localhost:4321/.

---

## Interactions

Pan (drag), zoom (wheel/pinch), hover/tap -> highlight node + neighbors and dim the rest, tap a **topic** -> detail card -> open its topic page, tap a **facet** (bridge mode) -> light it up across subjects, **double-tap** -> focus mode (hub-and-spoke local view). Controls: facet lens (Bridge/Threads), Resonance, Labels.

---

## Red Rising group (the third tier, demoed)

The seed now activates a real **Red Rising** group so all three tiers show: `lib/seed/starter-topics.ts` adds `isGroup` / `parentTitle` to `SeedTopic` and a `Red Rising` anchor in Books; `lib/actions/seed-starter-topics.ts` does a **two-pass insert** (group anchors first, then children with `parent_topic_id` resolved). New users get `Books -> Red Rising -> 3 sub-topics`.

For accounts seeded **before** this existed (e.g. the shared community account), there's a **dev-only backfill**: `GET /api/dev/backfill-red-rising` (logic in `lib/actions/backfill-red-rising.ts`). Reachable while logged in, idempotent, `NODE_ENV`-guarded (403 in prod). Safe to delete after running once.

---

## Community mode (current launch approach)

Magpie currently runs as a **shared-account community**: everyone enters the same `dogsled@dogsled.dev` account via "Enter Magpie" (the demo login), and sees/grows one shared grid + Nest. Per-user private accounts are **deferred** (post-waitlist). The machinery for private accounts already exists (RLS + seed-on-first-login). Login copy was reframed from "demo" to "community" (`app/(auth)/login/page.tsx`, `components/home/welcome-hint.tsx`).

---

## Local login setup (important for a fresh checkout)

The demo/community login needs **one** server secret in `.env.local`: `DEMO_LOGIN_PASSWORD` (a password for the account) **or** `SUPABASE_SERVICE_ROLE_KEY` (passwordless path). It reads `.env.local`, **not** Vercel. Currently using the service-role key.

> **Supabase key migration (do before end of 2026):** legacy `anon`/`service_role` JWT keys are deprecated at the end of 2026. The anon key is already on the **new publishable** format (`sb_publishable_`); the service-role value is still the **legacy JWT**. Swap `SUPABASE_SERVICE_ROLE_KEY`'s value to a new `sb_secret_` key (in `.env.local` and Vercel), test the admin/passwordless login first, no code change needed.

---

## Pending / next steps

- **Commit + deploy** (prod already has its own login secret).
- **Run the Red Rising backfill** on the community account.
- **Supabase `service_role` -> `sb_secret_` migration** (before end of 2026).
- **Desktop responsive Nest** (Phase 9.5): mobile-first is shipped; `docs/nest-desktop.html` is the target for a future desktop layout (side panel + full-width canvas).
- Optional: in-app facet chips (currently you light up facets by tapping facet nodes in Bridge mode), Glints, per-user accounts.

**Known issue (pre-existing, low-risk):** `seedStarterTopics` guards on "user has 0 subjects", so two brand-new accounts seeding at the same instant could double-insert. Moot for the shared community account (already seeded); relevant only when per-user signup ships. Fix it then with a unique constraint or advisory lock.

---

## Run / verify

`npm run dev` -> log in via "Enter Magpie" -> Nest tab. Gates: `npm run type-check` and `npm run build` (typedRoutes catches bad `Link href`s). The standalone reference: open `docs/nest-portable.html` directly in a browser.
