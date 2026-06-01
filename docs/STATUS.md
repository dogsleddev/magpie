# Magpie · Status at a Glance

*Updated 2026-06-01. The one-page view. Turn-by-turn steps: `docs/SOP.md`. Full requirements: `docs/BRD.md`. Build log: `PROGRESS.md`.*

---

## What it is

A personal **conversation gym**. *Collect curiosities. Talk them through.* You build a wiki of the things you find shiny; **Maggie** (the AI persona) helps you talk them out loud in 3-to-5-minute reps and remembers across topics, so curiosity compounds into things you can actually say.

**Product = Magpie. Persona = Maggie.** Domain: magpie.wiki.

## Why it wins

The moat is **behavior** (spoken practice is the product, not an input method) + **memory** (Maggie remembers across topics, a relationship) + **trust** (privacy infra). The graph and screenshot capture are table-stakes. **Pitch the gym, not the map.**

## Status

| Area | State |
|---|---|
| Hackathon | Won runner-up + $250 (Krava × Linq, May 2026) |
| Live app | https://magpie.wiki (one-click demo login) |
| Grid / 5 modes / facets / search / Add Topic | Live |
| Landing page + waitlist | **Built on branch `feat/landing-page`, pending deploy** |
| Krava privacy wrap | Live, prod routing unverified |
| Linq iMessage | Tier 0 webhook; real inbound loop not wired |

## Roadmap (phase checklist)

- [x] **Core app** (phases 1-5): auth, grid, voice capture, four AI modes
- [~] **Landing + waitlist** (built, pending deploy)
- [ ] **UI phase:** persona revert, upper-right nav, edit/delete topics + subtopics, onboarding, settings, custom tone + guardrails, the curiosity graph
- [ ] **The rest:** iPhone app, finish Linq, verify Krava, screenshot-to-converse capture, provenance, social
- [ ] **Flagship later:** Glints (inward surfacing), Nest View (the graph), Draw Out (charisma mode)

## Current focus

**Ship the landing** → LinkedIn post (now has a destination) → **UI phase**.

## Time-sensitive

LinkedIn post + Gemini deck (~2 days, BRD §8). The landing going live is what unblocks the post.

## Open decisions

Free vs paid tier; privacy default (public-opt-in vs private-with-toggle); how deep Maggie customization goes; iPhone native vs PWA; when the graph ships (does it gate on cross-context memory); Krava in production long-term.
