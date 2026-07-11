# Magpie

> **Magpie is now 2.0 (glint-first).** Canonical product model: [docs/MAGPIE_2.md](docs/MAGPIE_2.md). Build plan: [docs/SOP.md](docs/SOP.md). This doc predates the pivot; where it describes the daily habit, navigation, modes, or roadmap, MAGPIE_2.md wins. The setup, stack, scripts, code style, and brand reference below are still current.

> Collect curiosities. Talk them through.

A personal conversation gym. Build a grid of topics you care about. Get fresh angles in seconds. Riff for 3 to 5 minutes. Capture what you said. Watch the grid grow.

**Production:** [magpie.wiki](https://magpie.wiki)

---

## Quick start

This project is built on Windows 11 with PowerShell. All commands below are PowerShell.

```powershell
# Clone
git clone https://github.com/dogsleddev/magpie.git
cd magpie

# Install
npm install

# Copy env template and fill in your keys
Copy-Item .env.example .env.local
# then edit .env.local with your Supabase + Anthropic credentials

# Apply database schema
# Option A: paste supabase/migrations/0001_init.sql into the Supabase SQL editor
# Option B: supabase db push (if you have the Supabase CLI linked)

# Run
npm run dev
```

App boots on `http://localhost:3000`.

---

## What you need

- **Node.js 20+** (see `.nvmrc`)
- A **Supabase project** ([supabase.com](https://supabase.com))
- An **Anthropic API key** ([console.anthropic.com](https://console.anthropic.com))

Fill these into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...
SUPABASE_PROJECT_ID=...
```

---

## Stack

- Next.js 15 (App Router) + TypeScript strict
- Tailwind CSS + shadcn/ui
- Supabase (Postgres + Auth + RLS)
- Anthropic Claude API (Sonnet 4.5 + Haiku 4.5)
- Deployed on Vercel

---

## Structure

```
magpie/
├── CLAUDE.md                      # Project North Star (read first)
├── docs/                          # Spec, brand, messaging, prompts, plan, vision
│   ├── PRODUCT.md                 # Full product spec
│   ├── BRAND.md                   # Palette, typography, voice, mark
│   ├── MESSAGING.md               # Tagline hierarchy, one-line-per-surface rule
│   ├── SCHEMA.md                  # Supabase schema with rationale and RLS
│   ├── PROMPTS.md                 # All AI prompts with model selection
│   ├── BUILD_PLAN.md              # Phased build, deliverables per phase
│   ├── CHARISMA.md                # Questions mode (MVP), Draw Out (flagship)
│   ├── MEMORY.md                  # Four-level cross-context + pacing rules
│   ├── RESPONSIVE.md              # Mobile-first plus beautiful desktop
│   ├── FUTURE_FEATURES.md         # Post-MVP roadmap (Glints, Nest View, more)
│   ├── HACKATHON_KRAVA_LINQ.md    # Hackathon branch integration plan
│   ├── brand-page.html            # Working brand showcase, open in browser
│   └── magpie-v1-reference.html   # v1 prototype, open in browser
├── public/
│   ├── favicon.png
│   └── brand/                     # Mark, app icons (vectorize before launch)
├── app/                           # Next.js App Router
│   ├── (auth)/
│   ├── (main)/
│   ├── api/ai/                    # Server routes for AI calls
│   ├── globals.css
│   └── layout.tsx
├── components/                    # UI components
├── lib/
│   ├── queries/                   # The typed query spine (single source of truth)
│   ├── ai/                        # Prompts + Anthropic client
│   ├── supabase/                  # SSR clients
│   └── seed/
│       ├── starter-topics.ts      # 13 subjects, 18 facets, ~113 topics
│       └── bakes/                 # Pre-written content for Tier 2 mocked features
├── styles/tokens.css              # The plumage palette
├── supabase/migrations/           # SQL migrations (entity-group columns is_group / parent_topic_id are LIVE, not dormant)
└── package.json
```

---

## Build sequence

> Note: this is the original pre-2.0 build order and is kept for history. The current plan is glint-first (Slice-0: the glint loop on the shared account, no auth; then per-user auth, item controls, the Library, and communities). See `docs/SOP.md` and `docs/MAGPIE_2.md` section D. In 2.0 the old inward-surfacing "Glints" (item 10) is renamed the resurfacing engine, and "Glint" now means the daily capture.

Full plan: `docs/BUILD_PLAN.md`. The 10-hour prototype before the hackathon covers a slice of phases 1-5 plus minimal polish. The full sequence:

**MVP path:**

1. Scaffold + Auth
2. Schema + Queries
3. Home + Subject Navigation
4. Persona mode (bullet capture with mic)
5. AI modes (Brief, Challenge, Questions, Convo with pacing rules)
6. Facets navigation
7. Discover + Add Topic
8. Settings + Polish
9. Deploy to magpie.wiki

**Post-MVP:**

- 5.5: Topic Groups + Level 2 cross-context (the architectural unlock)
- 9.5: Desktop responsive layout (full two-pane experience)
- 10: Glints (inward surfacing)
- 11: Nest View (constellation graph)
- 12: Draw Out (charisma flagship)

---

## Deploy

```powershell
# First-time setup with Vercel CLI
npm install -g vercel
vercel login
vercel link

# Push to deploy
vercel --prod
```

Then in the Vercel dashboard:
1. Add custom domain `magpie.wiki`
2. Update DNS at your registrar
3. Set environment variables (same as `.env.local`)
4. Verify magic-link redirects in the Supabase Auth settings include the production domain

---

## Scripts

```powershell
npm run dev          # local dev server
npm run build        # production build
npm run start        # serve the production build locally
npm run lint         # next lint
npm run type-check   # tsc --noEmit
npm run format       # prettier write all files
npm run db:types     # regenerate lib/supabase/types.ts from the live schema
```

---

## Code style

- TypeScript strict mode
- Prettier defaults (handled by `npm run format`)
- Tailwind classes inline, no CSS-in-JS
- Server Components by default, Client Components only when interactive
- One component per file, default-exported
- **No em dashes anywhere.** Use periods, commas, parentheses, or colons.

---

## Brand quick reference

- **Palette:** off-black bg (#0A0A09), off-white text (#F5F4EF), iridescent teal/blue/purple accents
- **Fonts:** Fraunces (display) + DM Sans (body)
- **Voice:** Editorial UI copy. Maggie speaks lowercase, casual, brief, no AI pleasantries.

**Tagline hierarchy** (full rules in `docs/MESSAGING.md`):
- **Logo and in-app:** Collect curiosities. Talk them through.
- **Landing hero:** Get better at the conversations that matter.
- **Memorable second beat:** Be the most interesting person in the room by making everyone else feel like one.
- **About and bios:** Bring out the best in every conversation.

One line per surface. Never stacked.

Full spec in `docs/BRAND.md`.

---

## License

Personal project. All rights reserved by Chris and Magpie contributors.
