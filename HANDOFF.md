# Magpie · Handoff to New Chat

*Generated end of session, May 29, 2026. Read top to bottom before doing anything.*

---

## TL;DR (the 30-second briefing)

You are picking up an ongoing project called **Magpie**, a personal conversation gym at magpie.wiki. The founder is **Chris Dougherty** (dogsled.dev, GitHub `dogsleddev`). This session focused on the marketing landing page and the hackathon variant of it.

**Urgent timeline:** The Krava × Linq Hackathon is **Saturday, May 30, 2026** at Frontier Tower SF (995 Market Street, FL15). That is 1 to 2 days from when you read this. Submissions close 6:30 PM. Demos at 6:40 PM. Chris needs the homepage-hackathon.html and the actual Magpie product live before then.

**Status:**
- `homepage.html` (main marketing page): DONE and locked
- `homepage-hackathon.html` (hackathon variant with real Krava and Linq branding): DONE and locked
- `MESSAGING.md` (tagline hierarchy): DONE and locked
- `MICROCOPY.md` (feature taglines): DONE and locked
- The actual app (Next.js + Supabase + Krava + Linq): not yet built. SOP exists in `BUILD_PLAN.md` and `HACKATHON_KRAVA_LINQ.md`

**Files Chris will want you to read first:**
1. This file (you are reading it)
2. `docs/MESSAGING.md` (locked tagline hierarchy, do not violate)
3. `docs/HACKATHON_KRAVA_LINQ.md` (technical integration plan)
4. `docs/BRAND.md` (voice rules)
5. `docs/PRODUCT.md` (what Magpie actually is)

---

## How to talk to Chris (read this twice)

**Voice in working sessions:** Chris uses high-energy surfer-bro casual: "brudha," "stoked," "rad." Match it when the context is technical work or banter. Drop into more editorial register when he asks for finished copy or documents.

**Things Chris hates that read as AI tells:**
- **Em dashes.** Zero. In any deliverable, ever. Use periods, commas, parentheses, semicolons, or colons. Even one em dash in a copy doc gets noticed.
- The word **"actually"** as a defensive qualifier. "A partner who actually remembers" → "A partner who remembers." If "actually" can be cut without losing meaning, cut it.
- Marketing-shaped words: "unlock," "amazing," "discover insights," "next-level," "AI-powered," "supercharge."
- Excessive hedging. Direct opinions land harder than diplomatic ones with him.

**Things Chris likes:**
- Direct opinions with reasoning. "My pick: A. Here's why." beats "There are tradeoffs to consider."
- Concrete over abstract. "5 minutes" beats "a few minutes."
- Engineer-first details when relevant (code snippets, version strings, architecture diagrams).
- Bird metaphors that earn their keep (not gratuitous).
- Honest pushback when he's wrong about something. He respects it.

**Things to avoid:**
- Sycophancy and "Great question!"
- Over-explaining what you are about to do. Just do it and report back.
- Asking permission for trivial things. Use judgment.
- Making up information you do not have. If you do not know, search the web or ask.

**Stack reminders:**
- Windows 11 + PowerShell. NEVER suggest bash syntax for his terminal.
- Next.js 15 App Router + TypeScript strict
- Supabase (Postgres + RLS + magic-link auth + pgvector)
- Anthropic Claude API: Sonnet 4.5 (`claude-sonnet-4-5-20250929`), Haiku 4.5 (`claude-haiku-4-5-20251001`)
- Vercel deploy
- Tailwind + shadcn/ui (new-york theme, zinc base)
- IDE: Antigravity (Chris's tool). Claude Code for AI-assisted dev.
- Default SMB and startup context unless Chris asks otherwise.

---

## The project: what Magpie is

**Magpie is a personal conversation gym.** Three product dimensions: Subject × Topic × Facet. Five modes per topic: Maggie (default capture, voice-first), Brief (Haiku), Challenge (Sonnet), Questions (Haiku, the MVP charisma feature), Convo (Sonnet streaming). The persona is **Maggie**, renameable per-user.

**The brand thesis:** Curiosity is the source of charisma. Most people are not boring, they are just not encouraged to be interesting. Magpie is the wiki where you collect what you find shiny, and a conversation partner who remembers helps you turn those bullets into something you can say out loud.

**The three-brand model Chris operates:**
- **dogsled.dev** (Chris's portfolio and content hub, where Magpie lives as a product)
- **fastinsights.io** (Jessica's fractional finance services firm, will eventually be a SaaS)
- **dogfood.cafe** (Chris's experimental SaaS sandbox where Scout, the universal AI agent layer, gets tested)

Magpie is a separate product that lives under dogsled. Domain is **magpie.wiki**.

---

## What we did this session (May 28 to May 29)

### 1. Built the main marketing homepage

**File:** `docs/homepage.html` (148K, includes base64-embedded magpie mark in 3 places)

Structure: sticky nav, hero, problem section, how it works (Subject/Topic/Facet), 5 modes, second beat pull-quote, 3 feature spotlights (Glints/Draw Out/Nest), why magpie 6-card grid, CTA with waitlist form, footer.

Brand palette throughout: bg #0A0A09, text #F5F4EF, teal #1D9E75, blue #378ADD, purple #7F77DD, amber #EF9F27. Fraunces (display) + DM Sans (body). Zero em-dashes. Same visual language as `docs/brand-page.html` and `docs/magpie-v1-reference.html`.

### 2. Rewrote the tagline hierarchy

Old hierarchy had **"Get better at the conversations that matter."** as the hero. Chris preferred the curiosity-collection angle, so we promoted the brand line to hero and demoted the clarity line.

**Locked hierarchy:**

| Slot | Line | Where it lives |
|---|---|---|
| Hero / brand line | **Collect curiosities. Talk them through.** | magpie.wiki hero, logo lockup, in-app, footer, app splash |
| Hero sub | *A personal wiki for the things you find shiny, with a conversation partner who remembers.* | under the brand line on the landing |
| Second beat | **What you collect comes out in conversation.** | second scroll panel, pitch deck slide 2 |
| Manifesto banner | **Curiosity is charisma, slowed down.** | about page, pitch deck cover, long-form |
| Draw Out feature page | **Be the most interesting person in the room by making everyone else feel like one.** | Draw Out feature header, that card on homepage |
| Secondary brand line | **Bring out the best in every conversation.** | about page, social bios, App Store |
| Demoted (still available) | **Get better at the conversations that matter.** | email subject, LinkedIn caption, A/B test candidate |

**Important: This is locked.** Do not invent new taglines. If a surface needs copy, use one from this table. The full hierarchy with reasoning lives in `docs/MESSAGING.md`.

### 3. Created the feature microcopy table

**File:** `docs/MICROCOPY.md` (new file this session)

Feature-level italic Fraunces subtitles for every feature: Subjects ("the buckets you care about"), Topics ("a conversation worth having"), Facets ("where the connections live"), Maggie mode ("what's on your mind?"), Brief ("the primer you needed earlier"), Challenge ("the pushback you didn't see coming"), Questions ("doors, not dead-ends"), Convo ("talk it through"), Glints ("worth a look this week"), Discover ("things Maggie thinks you'd dig"), Draw Out ("practice making someone brilliant"), Nest View ("your curiosity, mapped"), Convo Roulette ("let chance pick the topic"), Journal ("your thinking, by date"), Add Topic ("catch it before it's gone").

These are locked. Same rule: do not invent new feature taglines. Pick from the table.

### 4. Built the hackathon variant of the homepage

**File:** `docs/homepage-hackathon.html` (162K, includes everything in homepage.html plus integration sections)

This was the bigger lift this session. The variant was built twice:
- **First pass:** I used the placeholder Krava and Linq descriptions from the original `HACKATHON_KRAVA_LINQ.md` doc, which described Krava as a "PII scrubbing gateway." That description was inaccurate.
- **Second pass (locked version):** Chris pointed me at the real Luma event page and Krava's actual site. I rebuilt the integration sections with real brand truth.

**What is in the hackathon homepage that is NOT in the main homepage:**
- A hackathon banner at the top: "Krava × Linq Hackathon · Frontier Tower SF · Saturday, May 30, 2026" with a pulsing Krava-orange dot
- A Linq integration spotlight after the Five Modes section, with a styled iMessage thread preview showing Maggie capturing a thought from a 2:47 AM text
- A Krava integration spotlight after the Features section, with the real four Krava primitives (Passkey, Encrypted Memory, PrivateLLM, Inference Router), a real SDK code snippet, and an architecture flow diagram (Magpie → Krava → TEE Inference)
- A "Built with" credits section showing Krava (orange #ff5a1f), Linq (blue), and Anthropic (teal)
- A CTA section that leads with a live demo phone number (currently placeholder +1-415-555-0142, swap before May 30)
- Updated nav CTA: "Try the demo" instead of "Join the waitlist"
- Footer credit: "Built at the Krava × Linq Hackathon · Frontier Tower SF · May 30, 2026"

**Real brand colors used:**
- Krava orange `#ff5a1f` (from their site, used for the Krava section dot, partner-tag, code snippet keywords, and Built With card)
- Linq blue (`#378ADD` from Magpie's palette, which is effectively iMessage blue, used for the Linq section dot, iMessage thread bubbles, and Built With card)

---

## File inventory (everything in this bootstrap)

### Documentation (`docs/`)

| File | Status | What it is |
|---|---|---|
| `BRAND.md` | locked | Voice, palette, type, the lowercase-Maggie rule, Glints vs Discover copy patterns |
| `MESSAGING.md` | **rewritten this session** | The locked tagline hierarchy |
| `MICROCOPY.md` | **new this session** | The locked feature taglines table |
| `PRODUCT.md` | locked | What Magpie is, the 3 dimensions, the 5 modes, the user model |
| `SCHEMA.md` | locked | Supabase schema with RLS policies and dormant Option 2 columns |
| `PROMPTS.md` | locked | All Maggie system prompts (Brief, Challenge, Questions, Convo, Organize, Extract) |
| `BUILD_PLAN.md` | locked | The 10-hour SOP from clean repo to magpie.wiki live |
| `CHARISMA.md` | locked | The conversational generosity rubric, the open-vs-closed question framework |
| `MEMORY.md` | locked | The 5-level cross-context memory architecture |
| `RESPONSIVE.md` | locked | The mobile-first responsive design system |
| `FUTURE_FEATURES.md` | locked | Phase 9 to v2 ideas (Daily Magpie email, group convos, etc.) |
| `HACKATHON_KRAVA_LINQ.md` | **rewritten this session** | The technical integration plan, now with real Krava architecture |
| `homepage.html` | locked | The main marketing landing page |
| `homepage-hackathon.html` | **new and locked** | The hackathon variant with real Krava and Linq branding |
| `brand-page.html` | reference | The original brand guide (color swatches, type specimens, logo lockup) |
| `magpie-v1-reference.html` | reference | The original product reference for the app UI |

### Root config

`CLAUDE.md`, `README.md`, `.env.example`, `.gitignore`, `.nvmrc`, `.prettierrc.json`, `components.json`, `next.config.ts`, `package.json`, `postcss.config.js`, `tailwind.config.ts`, `tsconfig.json`.

### Scaffolded code (`app/`, `lib/`, `styles/`, `supabase/`, `public/`)

- `lib/ai/prompts.ts` (system prompts with pacing rules in convoSystemPrompt)
- `lib/ai/client.ts` (Sonnet 4.5 and Haiku 4.5, ready to be wrapped by Krava during hackathon)
- `lib/seed/starter-topics.ts` (113 topics, 13 subjects, 18 facets, includes Red Rising and dystopia for demo continuity)
- `lib/seed/bakes/*` (6 bake files including the Diane drawout script at `lib/seed/bakes/drawout-script.ts`)
- `lib/supabase/{client,server,middleware}.ts` (auth helpers for Next.js App Router)
- `lib/queries/` (the typed query function spine, consumed by both modules and Scout)
- `supabase/migrations/0001_init.sql` (RLS policies on every user-owned table, dormant Option 2 columns)

---

## The hackathon (URGENT, Saturday May 30, 2026)

### Real event details (verified from luma.com/krava-linq-hackathon)

- **Name:** Krava × Linq Hackathon: Build Private-by-Default AI Apps
- **Date:** Saturday, May 30, 2026
- **Location:** Frontier Tower, 995 Market Street, San Francisco, FL15 Conference Room
- **Schedule:** 11 AM check-in, 12 PM start, 6:30 PM submissions, 6:40 PM demos (5 min each), winners 15 min after last demo
- **Prizes:**
  - 🏆 $500 Best Krava Project (use of Krava SDK)
  - 🛡️ $250 Best Krava + Linq Integration
  - ✨ $250 Best Overall Execution
- **Team size:** 1 to 4 people. Solo is allowed.
- **Hosted by:** Frontier Tower SF (Jim Chu, Ashan Devine, Paritosh Kulkarni, David Lacklen)
- **Chris's invite URL:** https://luma.com/krava-linq-hackathon?tk=DZ5qhQ

### The integration architecture

**Krava (krava.io)** is privacy-as-a-service for LLM applications and agents. Four primitives:
1. **Private PasskeyID.** WebAuthn (Face ID, Touch ID), one-way hashed credentials, no email or password
2. **Secure Memory.** AES-256-GCM encryption client-side, key held only by the user
3. **PrivateLLM.** Inference inside NVIDIA H100/H200 Trusted Execution Environments, SOC 2 Type II, cryptographically attested
4. **Inference Router.** Picks the cheapest, fastest, most-private enclave per request (Tinfoil, Prem, Phala, NEAR AI, or Krava's own), with commercial fallback (Anthropic, OpenAI, Fireworks)

SDK: `npm install @kravalabs/api-client`. Brand color: orange `#ff5a1f`. Their canonical example uses Linq as a Krava-powered iMessage app (so Magpie is hitting the exact intersection they want to see).

**Linq (linqapp.com)** is the iMessage, RCS, and SMS layer for AI agents. $20M Series A from TQ Ventures (Feb 2026). 50,000+ teams. Powers Poke. SOC 2 Type II. Native iMessage features (read receipts, voice notes, tapbacks, group chats) work end-to-end. Brand product name: "Linq Blue."

**Magpie's integration:** Krava wraps `lib/ai/client.ts` so every Anthropic call routes through it. Linq is a new front door at `app/api/linq/webhook/route.ts` that receives incoming iMessages, looks up the user by phone number, runs the convo through Krava-wrapped Claude, and pushes the response back via Linq's outbound API. After idle, an Organize pass turns the iMessage thread into a structured topic in the wiki.

Full technical integration plan in `docs/HACKATHON_KRAVA_LINQ.md`.

### Submission target

**Primary:** Best Krava Project ($500). Magpie is one of the best privacy use cases possible for Krava because a wiki of someone's actual curiosity is more revealing than their search history. Lean into this in the demo.

**Bonus:** Best Krava + Linq Integration ($250). Linq makes Magpie texted-from-anywhere, which is the natural front door for capture-as-it-happens.

### TODOs before May 30

1. **Run the 10-hour SOP from `BUILD_PLAN.md`** on the `main` branch to get magpie.wiki live with the base product (the 5 modes, Maggie capture, the home grid)
2. **Branch to `hackathon`** before the event
3. **Get Krava API key** from the sponsor table at event start
4. **Get Linq sandbox phone number** from the sponsor table at event start
5. **Run the SOP in `HACKATHON_KRAVA_LINQ.md`** during the 6-hour build window (Krava wrapper + Linq webhook + iMessage inbox view)
6. **Swap the placeholder phone number** in `homepage-hackathon.html` (`+1 (415) 555-0142` appears in 2 places: the iMessage thread header and the CTA card) with the real Linq Blue number once provisioned
7. **Hook up the waitlist form action** in both homepages, or remove the form and let the demo number be the only CTA
8. **Deploy** `homepage-hackathon.html` to a temporary subdomain (suggestion: `hack.magpie.wiki`) so judges can visit the URL directly
9. **Submit** via the hackathon submission form with: deployed app URL, team name (Chris solo or with a teammate), short description, track selection (both Krava and Krava+Linq), explanation of Krava usage, explanation of Linq integration, GitHub repo

### Demo strategy

5-minute slot. Open with magpie.wiki on the laptop. Pull out phone. Text Maggie at her Linq number. Have a 60 to 90 second exchange about something specific (the dystopias/utopias prompt in the homepage iMessage thread is a good demo seed). Say "save" or wait for idle. Switch to the laptop. Show the new iMessage inbox card appearing. Open it. Show the proposed organization (topic title, subject, facets). Accept. Show the topic now in the grid with the Convo thread preserved. Mention Krava wrapping every AI call along the way (and why a wiki of someone's actual thinking is the highest-stakes privacy use case).

Three minutes of clean flow beats five minutes of feature tour.

---

## Pending TODOs and decisions outside the hackathon

1. **The actual app build.** The bootstrap is scaffolding only. The 10-hour SOP in `BUILD_PLAN.md` builds the working product. Has not been run yet.
2. **The Finance Engineer certification submission** through Rillet's vibe coding program is referenced in Chris's memory as "recently completed for the staffing model at staff.dogsled.dev." Chris wants to add a chatbot to that tool. This is parked, not blocking.
3. **The 30-day LinkedIn challenge.** Planned but not started. The demoted hero line ("Get better at the conversations that matter") works well as a LinkedIn caption.
4. **Scout (the universal AI agent layer)** is the long-term direction for the SaaS product on dogfood.cafe (separate from Magpie). Has 5 modules built, 16 stubs. Not blocking Magpie.

---

## How to start the new chat

Chris will paste this entire file into a new chat as the opening message. The new Claude should:

1. Read this whole file before responding to anything
2. Read `docs/MESSAGING.md` and `docs/HACKATHON_KRAVA_LINQ.md` in full
3. Skim `docs/BRAND.md`, `docs/PRODUCT.md`, and the other docs as relevant context
4. Match Chris's voice (surfer-bro casual in working sessions, editorial when delivering finished work)
5. Use PowerShell syntax for any terminal commands
6. Never use em-dashes in any deliverable
7. Default to direct opinions with reasoning, not diplomatic hedging
8. Do not invent new taglines or microcopy. Use the locked tables.
9. Search the web when something is checkable (facts, dates, real companies). Do not make things up.
10. When in doubt, ask Chris a direct question. He prefers a clear question over a guess.

The first message Chris sends will probably tell you what he wants to work on next. The most likely candidates:
- Running the 10-hour SOP to get magpie.wiki live before May 30
- Refining the hackathon homepage based on feedback
- Building specific components (the iMessage inbox view, the Krava wrapper, the Linq webhook)
- Preparing the demo script
- Something completely different (he is a builder with several plates spinning)

Whatever it is, you have full context now. Go help him win the hackathon.

🪶
