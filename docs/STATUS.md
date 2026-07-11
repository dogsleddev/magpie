# Magpie · Status at a Glance

> **Magpie is now 2.0 (glint-first).** Canonical product model: [MAGPIE_2.md](MAGPIE_2.md). Build plan: [SOP.md](SOP.md). This doc predates the pivot; where it describes the daily habit, navigation, modes, or roadmap, MAGPIE_2.md wins. The "What it is" and "Why it wins" positioning below still holds; the Status table, Roadmap, and Current focus are superseded (see the 2.0 notes inline).

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
| Landing page + waitlist | Live (this row is stale: the landing shipped) |
| Nest constellation + entity groups (Red Rising, Corvids) | Live (groups are active, not dormant) |
| Krava / Linq | Being removed (branch `chore/remove-krava-linq`); out of the 2.0 stack |

## Roadmap (phase checklist)

_Superseded by the glint-first staged roadmap in [MAGPIE_2.md](MAGPIE_2.md) section D. The 2.0 order: **Slice-0** (the glint loop on the shared account, no auth, dogfooded first) → **Phase 1** (per-user auth, public read view, the daily email/text trigger) → **Phase 2** (item controls, server-side voice, controlled facets) → **Phase 3** (Library resurfacing, embeddings) → later (communities, adaptive temperature). The pre-pivot checklist below is kept for history._

- [x] **Core app** (phases 1-5): auth, grid, voice capture, four AI modes
- [x] **Landing + waitlist** (shipped)
- [x] **Nest View** (the graph, live at `/nest`, replaced the Journal tab; not "later" anymore)
- [ ] **UI phase (old framing):** most of this is either done (edit/delete topics + subtopics, settings, the graph) or folded into the 2.0 slices above
- [ ] **Flagship later:** Draw Out (charisma mode)

Note: the old "Glints (inward surfacing)" is renamed the **resurfacing engine** in 2.0; the word **glint** now means the ~30-second daily capture that keeps the streak.

## Current focus

_Superseded. The 2.0 focus is **Slice-0: prove the glint loop** on the shared account (catch → connection chips → streak), dogfooded for about two weeks before auth or anything heavier. The LinkedIn launch is parked. See [MAGPIE_2.md](MAGPIE_2.md) section D and [SOP.md](SOP.md)._

## Time-sensitive

_Superseded (the landing shipped and the LinkedIn launch is parked for the pivot). Current priorities live in [SOP.md](SOP.md)._

## Open decisions

_Mostly settled by the pivot: the graph shipped, Krava is being removed, and pricing (free now, paid later) plus the public read view are decided. Live open decisions are in [MAGPIE_2.md](MAGPIE_2.md) section E._

Free vs paid tier; privacy default (public-opt-in vs private-with-toggle); how deep Maggie customization goes; iPhone native vs PWA; when the graph ships (does it gate on cross-context memory); Krava in production long-term.
