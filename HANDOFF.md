# Magpie · Handoff to a New Session

_Updated 2026-06-09. Entity groups shipped (Red Rising, Corvids on prod). The umbrella check now auto-nests new topics under entity parents on every Add Topic. Homepage QC pass done. Nest opens in Desktop mode on desktop viewports. Read top to bottom before doing anything._

---

## TL;DR (30-second briefing)

You are picking up **Magpie**, a personal conversation gym at **magpie.wiki**. Founder: **Chris Dougherty** (dogsled.dev, GitHub `dogsleddev`). Windows 11 + PowerShell.

**The app is BUILT and LIVE.** It won runner-up + $250 at the Krava × Linq hackathon (May 30, 2026). The Nest mind map, community launch, entity groups, and the umbrella auto-group feature are all live. One open bug: iPhone mic (WebKit stub, decision locked to keyboard dictation hint).

**Read in this order:**

1. **`CLAUDE.md`** (the North Star, and its "Current status" section: what is live right now) ← start here
2. **`PROGRESS.md`** (build log; the START HERE block has the one open bug + the backlog)
3. **`docs/NEST.md`** (the flagship Nest mind map)
4. **`docs/BRD.md`** (product requirements + direction) + **`docs/COMPETITORS.md`** (positioning: "pitch the gym, not the map")
5. Skim `docs/MESSAGING.md` + `docs/MICROCOPY.md` (locked copy), `docs/BRAND.md` (voice), `docs/PRODUCT.md`, `docs/FUTURE_FEATURES.md`

---

## How to talk to Chris (read twice)

**Voice in working sessions:** high-energy surfer-bro casual ("brudha," "stoked," "rad"). Match it for technical work and banter. Shift to a refined editorial register for finished copy, anything client-facing, or anything touching his co-founder Jessica / fastinsights.io.

**AI tells Chris hates:**

- **Em dashes. Zero, ever.** Use periods, commas, parentheses, colons. Even one in a deliverable gets noticed.
- **"actually"** as a defensive qualifier. Cut it.
- Marketing-shaped words: "unlock," "amazing," "discover insights," "supercharge," "AI-powered," "next-level."
- Excessive hedging. Direct opinions land harder.

**Chris likes:** direct opinions with reasoning ("My pick: A, here's why"), concrete over abstract ("5 minutes" not "a few minutes"), engineer-first detail when relevant, bird metaphors that earn their keep, honest pushback when he is wrong.

**Avoid:** sycophancy / "Great question," over-explaining before acting, asking permission for trivial things, making up facts (search or ask instead).

**Coordinate before irreversible/outward moves** (pushes auto-deploy to prod; he does dashboard clicks for Supabase/Vercel/DNS/Linq, you drive the code).

---

## What Magpie is (current)

A **conversation gym**. Hero line: _Collect curiosities. Talk them through._ You build a wiki of what you find shiny and talk it out loud in 3-to-5-minute reps with a persona who remembers.

- **Three dimensions:** Subject × Topic × Facet.
- **Five modes per topic:** **Maggie** (voice-first capture, default tab), Brief, Challenge, Questions, Convo.
- **Persona = Maggie. Brand / product / domain = Magpie.** (See naming note below.)
- **Front door:** iMessage via Linq. **Privacy:** AI calls wrapped through Krava (fallback to Anthropic).

---

## Current state (live)

- **https://magpie.wiki**, a **shared-account community**: everyone enters via one-click **"Enter Magpie"** (`dogsled@dogsled.dev`) and grows one shared grid + Nest. Per-user private accounts are deferred to post-waitlist.
- **Shipped:** the home grid by Subject, the **Nest** mind map (`/nest`, Desktop overlay auto-opens on >=1024px viewports), **entity groups** (Red Rising, Corvids on prod; umbrella check on every Add Topic), Add Topic with auto-filed subject + facets + grouping, **Rediscover** (random topic), search (`/search`), Recent Ideas + inline editing (`/recent`), Facets nav (`/facets`, chips link in), the five modes, Maggie's per-topic AI **opener**, a quiet **delete-topic**, mic-to-text, Organize, the Krava privacy wrap, the Linq Tier 0 webhook. Landing leads with the Nest + waitlist. `magpie.wiki/krava` + `/linq` still up.
- **Homepage pass (2026-06-09, live):** nav CTA contrast fixed, "See the community nest" is the first highlighted button, "See the community topics" replaces the old waitlist button, five-modes section matches the real tabs, Maggie card trimmed.
- **LinkedIn post drafted** (needs the people to tag + `og-nest.png`). See `docs/LINKEDIN_LAUNCH.md`.
- **Open / caveats:**
  - **iOS mic switched to keyboard dictation** (live, unverified on-device): WebKit Web Speech is a dead stub on iOS (`components/mic/is-ios.ts`). Test on Chris's iPhone.
  - **Umbrella check not yet prod-verified.** Shipped, but the flow (add a Seahawks topic -> lands under the group parent) has not been exercised on the live community account.
  - **Privacy stays off the site.** Krava is Level-1 only (inference TEE, app-key based), storage is plaintext, falls back to Anthropic on any error, prod routing unverified.
  - **Linq inbound loop is not real yet** (sandbox is outbound-only). Tier 0 webhook code exists.
  - Repo is **public**; migrate the Supabase `service_role` value to `sb_secret_` before end of 2026.

---

## The new direction (post-hackathon)

Full detail in `docs/BRD.md`. Sequence and headline items:

1. **BRD** (done: `docs/BRD.md`).
2. **LinkedIn post** (draft ready in `docs/LINKEDIN_LAUNCH.md`, needs @handles + `og-nest.png`). Time-sensitive.
3. **UI:** home nav in the upper right, **persona revert to Maggie**, edit/delete topics, new-user subject/facet onboarding, custom tone/personality, guardrails, and the **3D curiosity graph** ("the shape of your curiosity," per COMPETITORS §3).
4. **The rest:** individual accounts, iPhone app, finish the real Linq inbound loop, verify Krava on prod, screenshot-and-converse capture, "where did you hear it" provenance, social.

**Positioning (use this in pitches):** the moat is **behavior** (spoken practice) + **memory** (Maggie remembers across topics) + **trust** (privacy). The graph and screenshot-capture are table-stakes. **Pitch the gym, not the map.**

**Time-sensitive GTM:** the **LinkedIn launch post is drafted** (needs the people to tag + a constellation image; see `PROGRESS.md` START HERE), then the Gemini presentation and Loom demo. See BRD §8.

---

## Naming decision (locked)

**Product = Magpie. Persona = Maggie.** Settled and live: the persona is **Maggie** across the app (the default `user_settings.persona_name`, the threaded `personaName`, the capture/chat tab). Renameable in settings.

---

## Stack and ops

- Next.js 15 (App Router, TS strict), Supabase (Postgres + RLS), Anthropic (Sonnet 4.5 `claude-sonnet-4-5-20250929`, Haiku 4.5 `claude-haiku-4-5-20251001`), **Krava** (`@kravalabs/api-client`, TEE wrap, fallback-gated on `KRAVA_APP_KEY`), **Linq** (iMessage), Vercel, Tailwind.
- `lib/queries/` is the single source of truth (UI + AI + webhook share it).
- **Connectors:** `vercel-chris` (Vercel MCP) is connected to the `dogsled` team and used to drive/verify deploys. `.mcp.json` is gitignored. `gh-chris` did not connect; use plain `git`.
- **Repo:** `github.com/dogsleddev/magpie` (public). Push to `master` auto-deploys to magpie.wiki.

---

## Hard rules (do not violate)

- **No em dashes** anywhere (code, comments, copy, commits).
- **Do not invent taglines or microcopy.** Use `MESSAGING.md` / `MICROCOPY.md`. New features without a locked tagline ship with the feature name only.
- **Clear `.next` before any build or dev** (`Remove-Item -Recurse -Force .next`); OneDrive corrupts stale artifacts.
- **RLS everywhere.** No service-role key in the client. The admin client (`lib/supabase/admin.ts`) is server-only, for the Linq webhook.
- **Verify before calling anything done:** `npm run type-check`, clean `npm run build`, exercise it. Coordinate before pushing (prod auto-deploys).

---

## Open decisions (for Chris)

- Free vs paid tier? Privacy default (public-opt-in vs private-with-toggle)? Maggie persona customization depth? iPhone native vs PWA? When does the graph ship (does it gate on cross-context memory)? Does Krava stay in production long-term?

🪶
