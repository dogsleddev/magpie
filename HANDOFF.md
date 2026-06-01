# Magpie · Handoff to a New Session

*Updated 2026-05-31, the morning after the hackathon. Read top to bottom before doing anything.*

---

## TL;DR (30-second briefing)

You are picking up **Magpie**, a personal conversation gym at **magpie.wiki**. Founder: **Chris Dougherty** (dogsled.dev, GitHub `dogsleddev`). Windows 11 + PowerShell.

**The app is BUILT and LIVE.** It just **won runner-up and $250** at the Krava × Linq hackathon (Frontier Tower SF, May 30, 2026), with positive judge feedback (a real product, not an LLM wrapper). The hackathon is over. This is now the **product phase**.

**Agreed next-phase sequence:** **BRD → landing page → UI → the rest.**

**Read in this order** (for the fastest orientation, skim `docs/STATUS.md` then `docs/SOP.md` first):
1. **`docs/BRD.md`** (the business + product requirements, the new direction, the backlog) ← start here
2. **`docs/COMPETITORS.md`** (positioning: "pitch the gym, not the map")
3. **`PROGRESS.md`** (build state + known issues)
4. **`CLAUDE.md`** (conventions, the North Star)
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

A **conversation gym**. Hero line: *Collect curiosities. Talk them through.* You build a wiki of what you find shiny and talk it out loud in 3-to-5-minute reps with a persona who remembers.

- **Three dimensions:** Subject × Topic × Facet.
- **Five modes per topic:** **Maggie** (voice-first capture, default tab), Brief, Challenge, Questions, Convo.
- **Persona = Maggie. Brand / product / domain = Magpie.** (See naming note below.)
- **Front door:** iMessage via Linq. **Privacy:** AI calls wrapped through Krava (fallback to Anthropic).

---

## Current state (live)

- **https://magpie.wiki** with a one-click **"Enter Magpie"** demo login (judges) plus a password path. Magic link still pending SMTP.
- **magpie.wiki/krava** (the pitch deck, Office-viewer embed) and **magpie.wiki/linq** (the iMessage demo screenshot).
- **Shipped:** home grid by Subject, Add Topic (talk to the persona, auto-files subject + facets), search (`/search`), Recent Ideas + inline subject/facet editing (`/recent`), Facets navigation (`/facets`), the five modes, mic-to-text, Organize, the Krava privacy wrap (fallback-gated), the Linq Tier 0 webhook.
- **Caveats to know:**
  - Persona name **shows "Magpie" in code** from this session; the decision is to **revert to "Maggie"** (below).
  - **Krava prod routing is unverified** (it may be silently falling back to Anthropic if the Vercel `KRAVA_APP_KEY` is off). The local probe confirmed Krava works.
  - **Linq inbound loop is not real yet** (the sandbox is outbound-only, so the demo used a staged thread). Tier 0 webhook code exists.
  - Repo is **public**; Chris declined secret rotation for the event. Revisit before any wider launch.

---

## The new direction (post-hackathon)

Full detail in `docs/BRD.md`. Sequence and headline items:

1. **BRD** (done: `docs/BRD.md`).
2. **Landing page** + waitlist (scroll-through functionality; `docs/homepage.html` is the reference, build it for real).
3. **UI:** home nav in the upper right, **persona revert to Maggie**, edit/delete topics, subtopics, new-user subject/facet onboarding, custom tone/personality, guardrails, and the **3D curiosity graph** ("the shape of your curiosity," not a generated diagram, per COMPETITORS §3).
4. **The rest:** iPhone app, finish the real Linq inbound loop, verify Krava, screenshot-and-converse capture, "where did you hear it" provenance, social.

**Positioning (use this in pitches):** the moat is **behavior** (spoken practice) + **memory** (Maggie remembers across topics) + **trust** (privacy). The graph and screenshot-capture are table-stakes. **Pitch the gym, not the map.**

**Time-sensitive GTM:** LinkedIn post in ~2 days (the win), Gemini presentation, Loom demo. See BRD §8.

---

## Naming decision (locked)

**Product = Magpie. Persona = Maggie.** This session's code renamed the persona to "Magpie"; that gets **reverted** to Maggie (migration default, the live `user_settings.persona_name`, threaded `personaName`). The capture tab is named after the persona ("Maggie"), distinct from the "Convo" chat mode. `CLAUDE.md` already says Maggie, so the code is what drifted.

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
