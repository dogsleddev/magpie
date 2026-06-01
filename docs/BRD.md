# Magpie · Business + Product Requirements (BRD / PRD)

**Owner:** Chris Dougherty (dogsled.dev) · **Updated:** 2026-05-31 (post-hackathon) · **Status:** living
**Companions:** `docs/COMPETITORS.md` (positioning), `docs/PRODUCT.md` (product spec), `docs/MESSAGING.md` + `docs/MICROCOPY.md` (locked copy), `docs/BRAND.md` (voice), `docs/FUTURE_FEATURES.md` (deep backlog), `PROGRESS.md` (build log), `HANDOFF.md` (new-session entry point).

This is the #1 post-hackathon deliverable. The agreed build sequence is **BRD → landing page → UI → the rest.**

---

## 0. Snapshot

- **Won runner-up + $250** at the Krava × Linq hackathon (Frontier Tower SF, May 30, 2026). Judge feedback was positive: a real product, not an LLM wrapper.
- **Live at https://magpie.wiki** (one-click judge login), with `magpie.wiki/krava` (deck) and `magpie.wiki/linq` (iMessage demo).
- Phases 1 to 5 shipped, plus this session's adds (Add Topic via the persona, search, Recent Ideas + editing, Facets nav, Krava privacy wrap, Linq Tier 0 webhook). See `PROGRESS.md`.

---

## 1. Vision and one-liner

- **One-liner (locked hero):** *Collect curiosities. Talk them through.*
- **Manifesto:** *Curiosity is charisma, slowed down.*
- **What it is:** a personal **conversation gym**. You build a wiki of the things you find shiny, and **Maggie** (the AI persona) helps you talk them out loud for 3 to 5 minutes and remembers everything, so your curiosity compounds into things you can actually say.

## 2. Problem and insight

People are not boring, they are under-rehearsed. Curiosity is the source of charisma, but almost no one practices articulating what they are curious about out loud. Capture tools store; chat tools answer; neither builds the muscle. **Insight:** capture what pulls you, talk it through in short reps, and a partner who remembers turns scattered bullets into conversation.

## 3. Target user

- **Primary:** curious knowledge workers, "talkers and thinkers" who want to be sharper in real conversation (dinner parties, meetings, dates, networking). SMB / startup context by default.
- **Secondary:** students, lifelong learners, creators who think out loud.

## 4. Positioning and differentiation

Full analysis in `docs/COMPETITORS.md`. The short version:

- **The white space (verified):** the entire AI mind-map category is document-to-diagram. No competitor does voice / talk-it-out / a persona that remembers. Magpie owns the "conversation gym" quadrant alone.
- **The moat is behavior + memory + trust**, not the artifact:
  - **Behavior:** the talk-out-loud rep is the product, not an input method.
  - **Memory:** Maggie remembers across topics. A relationship, not a feature. Deepest moat.
  - **Trust:** privacy infra (TEE inference, identity decoupled) is genuinely rare here.
- **Honest gut-check:** the 3D graph and screenshot capture are **table-stakes**, not differentiators (mindmapai already captures pages; everyone has mindmaps). **Pitch the gym, not the map.**
- **Closest threats:** mindmapai.app (fastest shipper) near-term; horizontal assistants with voice + memory (ChatGPT/Gemini) long-term. Defense: opinionated structure (Subject/Facet ontology, five modes, the ritual) + privacy.

## 5. The product (current shape)

- **Three dimensions:** Subject × Topic × Facet (Subjects hold Topics; Facets are cross-cutting tags that surface the same curiosity through different lenses).
- **Five modes per topic:** **Maggie** (voice-first bullet capture, the default tab), **Brief** (talking points, Haiku), **Challenge** (a hot take / steelman, Sonnet), **Questions** (generative questions, Haiku), **Convo** (streaming chat with Maggie, Sonnet).
- **Persona:** **Maggie** (the personality you talk to). **Brand / product / domain:** **Magpie**. (See 7.1.)
- **Surfaces today:** home grid by Subject, Add Topic (talk to the persona, auto-files subject + facets), search, Recent Ideas (newest-first, inline edit of subject + facets), Facets navigation, "Remember this topic?" (random resurfacing), mic-to-text on every input, Organize.
- **Front door:** iMessage via Linq. **Privacy:** every AI call wrapped through Krava, fallback to Anthropic.

## 6. Current state (built and live)

| Area | State |
|---|---|
| Auth | One-click "Enter Magpie" demo login (judges) + password. Magic link pending SMTP. |
| Grid + Subjects | Live |
| Topic + 5 modes | Live (Brief/Challenge/Questions cached, Convo streamed + persisted) |
| Add Topic (talk to persona) | Live (AI assigns subject + facets) |
| Search, Recent Ideas + edit, Facets nav | Live |
| Krava privacy wrap | Live, fallback-gated; **prod routing needs verifying** (may be falling back to Anthropic) |
| Linq iMessage | Tier 0 webhook live; sandbox is outbound-only, so the live inbound loop is **not** real yet (demo used a staged thread) |
| `/krava`, `/linq` | Live demo/submission pages |
| Persona name | **Code currently shows "Magpie" (changed this session); decision is to revert to "Maggie"** |

Known issues / tech debt: see `PROGRESS.md` (convo persistence on error, non-atomic message append, no `error.tsx`, etc.).

## 7. Requirements

### 7.1 Naming (locked decision)
- **Product / brand / domain = Magpie. Persona = Maggie.**
- **Action:** revert this session's persona rename. The capture tab is named after the persona ("Maggie"), distinct from the "Convo" chat mode ("Maggie convo vs Convo"). Touch: migration default, the live `user_settings.persona_name`, and any threaded `personaName`. `CLAUDE.md` already says Maggie, so the code is the thing that drifted.

### 7.2 Build sequence (Chris's priority)
1. **PRD / BRD** (this doc) + positioning. ← now
2. **Landing page:** a real marketing landing with scroll-through functionality and a waitlist. `docs/homepage.html` is the reference; build it as the production page + wire waitlist capture.
3. **UI:** app polish (see 7.3 "Next").
4. **The rest:** iPhone app, finish Linq, verify Krava, deeper features.

### 7.3 Functional requirements (status: Live / Next / Later)

**Capture and wiki**
- Bullet capture with mic-to-text, auto-save, edit, delete. (Live)
- Organize bullets into buckets. (Live)
- **Edit topics, delete topics, subtopics.** (Next)
- **New-user setup: pick subjects + facets onboarding** (Substack-style; see FUTURE_FEATURES §2). (Next)
- **Screenshot + link capture → Maggie logs, analyzes, stores → you converse about it later.** The twist vs mindmapai is the *converse* layer, not the capture. (Later)
- **"Where did you learn / hear about it?" provenance** on a topic or thought. (Later)

**AI modes and persona**
- Brief / Challenge / Questions / Convo. (Live)
- **Custom tone and personality for Maggie** (per-user persona variants beyond name). (Next)
- **Guardrails** (content/safety bounds on Maggie's output + behavior). (Next)
- Cross-topic memory (Maggie remembers; see FUTURE_FEATURES §7d + MEMORY.md). (Later, but it is the moat, prioritize)

**Navigation and graph**
- Home grid, search, Recent Ideas, Facets nav. (Live)
- **Home navigation in the upper right.** (Next)
- **3D mind-map / graph (Obsidian-like) = "the shape of your curiosity"** (Topics as nodes weighted by how much you have talked, edges = facet + memory links, not auto-generated diagrams). Already in the deck as GRAPH VIEW. (Next, framed per COMPETITORS §3)

**Channels and platform**
- iMessage front door (Linq). Tier 0 live; **finish the real inbound loop + the Organize-to-topic flow** (sandbox was outbound-only). (Later)
- **Verify Krava actually routes on prod** (vs falling back); understand the SDK + retention guarantees. (Later)
- **iPhone app** (native vs PWA, decide). (Later)

**GTM surfaces**
- Landing page + waitlist. (Next, sequence step 2)
- Public profile / demo mode (FUTURE_FEATURES §1-3). (Later)

### 7.4 Hero features (what to pitch)
1. **The conversation gym** (the five modes, the 3 to 5 minute rep).
2. **Maggie remembers** (cross-context memory, the relationship).
3. **The curiosity graph** ("the shape of your curiosity," not a generated diagram).
Supporting wow: **iMessage capture.** Proof of trust: **privacy / Krava.** (Per COMPETITORS: lead with the gym + memory; privacy is the proof, not the headline.)

## 8. Go-to-market (time-sensitive)

- **LinkedIn post in ~2 days** about the win. Suggested angle uses the demoted line "Get better at the conversations that matter" (per MESSAGING.md). Lead with the runner-up + the "real product, not a wrapper" story.
- **Gemini presentation prep** (positioning from COMPETITORS, the hero features, the demo).
- **Loom demo video** (the gym loop + iMessage capture + the graph vision).
- **Marketing strategy:** waitlist from the landing page, the hackathon win as proof, dogsled.dev portfolio funnel.

## 9. Success metrics (early-stage)

- **North Star:** weekly **riffs** (3 to 5 min talk-throughs completed).
- Activation: % of new users who capture a thought and run one mode in session 1.
- Engagement: thoughts/week, topics added/week, modes used per topic.
- Retention: weekly active, streaks.
- Virality: waitlist growth, shares, iMessage captures.

## 10. Tech and infrastructure

- Next.js 15 (App Router, TS strict), Supabase (Postgres + RLS), Anthropic (Sonnet 4.5 + Haiku 4.5), **Krava** (TEE inference wrap, fallback-gated on `KRAVA_APP_KEY`), **Linq** (iMessage), Vercel.
- The `lib/queries/` spine is the single source of truth (UI + AI + webhook).
- Added this session: service-role admin client (for the unauthenticated Linq webhook), one-click demo login.

## 11. Open questions / decisions

- Free vs paid tier (Substack-style limits)?
- Privacy default: public-opt-in or private-with-toggle?
- How deep is Maggie persona customization (just tone, or full alternate system prompts)?
- iPhone: native app or installable PWA first?
- When does the graph ship, and does it gate on cross-context memory (MEMORY.md Level 3+)?
- Does Krava stay in production long-term, or is it a hackathon proof? (Verify it works end to end first.)
