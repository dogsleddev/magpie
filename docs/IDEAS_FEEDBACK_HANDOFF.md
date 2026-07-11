# Magpie · Ideas + Feedback (like / dismiss): readiness review and handoff

> **Magpie is now 2.0 (glint-first).** Canonical product model: [MAGPIE_2.md](MAGPIE_2.md). Build plan: [SOP.md](SOP.md). This doc predates the pivot and its like/dismiss scoping is now absorbed into 2.0: item controls are settled as a **binary Favorite / Dismiss / Highlight** on Brief, Challenge, and Questions (backed by a `response_items` table, not `content_feedback`), the preference signal becomes the **adaptive Maggie temperature** (a per-user `spice_score`, columns captured early and behavior flipped on later), and the account-model fork below is settled: **per-user auth (Phase 1)**, with the loop proven first on the shared account (Slice-0). Where this doc describes schema, surfaces, or the account model, MAGPIE_2.md wins. Keep it as the historical record of the like/dismiss investigation (the Discover/dormant-`discover_items` mapping and the Readwise pattern notes are still accurate).

_Lean readiness review, 2026-07-09. For the next session, when the feature is scoped. Feature in one line: Maggie proposes ideas; the user likes (favorites / saves) or dismisses them, and that signal conditions what Maggie generates next. Readwise-style feedback loop. Same like/dismiss extends to Brief and Challenge._

---

## TL;DR (the big finding)

**This is mostly "Discover, activated, plus a feedback loop that conditions Maggie."** The scaffolding is already partly built and dormant:

- The `discover_items` table and `lib/queries/discover.ts` already model **propose → accept → skip**. `acceptDiscoverItem` = like (it files the idea as a topic), `skipDiscoverItem` = dismiss. There is **no UI and nothing generates items**, so it has never been wired up.
- What is genuinely new: (1) a **feedback signal store** for like/dismiss on content that is NOT an idea-to-add (Brief, Challenge), (2) **generation** of ideas, (3) the **preference conditioning** that feeds the signal back into Maggie's prompts, (4) a **favorites/saved surface**.

So this is less "build from scratch" and more "activate Discover, add a feedback signal, and close the loop into the prompts."

---

## What Readwise does (the pattern you are borrowing)

Daily Review resurfaces saved highlights on a schedule. Each card has **Discard / Keep / Master / Feedback**. Feedback tells a spaced-repetition algorithm "sooner" or "later," so your reactions tune what returns and when. Half the feed is unprocessed items surfaced at random, half is what you are actively retaining. Sources: [reviewing highlights](https://docs.readwise.io/readwise/docs/faqs/reviewing-highlights), [spaced repetition](https://blog.readwise.io/hack-your-brain-with-spaced-repetition-and-active-recall/).

The transferable ideas: a feedback verb on every surfaced item; the feedback conditions future surfacing; decay and surprise (a dismissed thing does not come back for a while); diversity over pure relevance. Note: Magpie's own roadmap (`docs/FUTURE_FEATURES.md` sections 8 and 10) already commits to "decay and surprise" and "diversity over relevance," so this is aligned, not a new philosophy.

---

## Current architecture (what exists today)

| Piece | State | File(s) |
|---|---|---|
| **Discover** (propose new topics, accept/skip) | Query spine BUILT, **dormant** (no UI, no generation) | `lib/queries/discover.ts`, table `discover_items` (`status` in pending/accepted/skipped) |
| **AI text modes** (Brief, Challenge, Questions) | Live, cached, rerollable | `app/api/ai/{brief,challenge,questions}/route.ts`, `components/topic/text-mode.tsx` (has the Reroll button) |
| **AI cache** | Live | `lib/queries/ai-cache.ts`, table `ai_cache` (`mode` CHECK in brief/challenge/related/questions), reroll = `clearCached` then refetch |
| **Prompts** | Live, take ONLY the topic | `lib/ai/prompts.ts` (no prompt currently accepts any preference/history context) |
| **Convo** | Live, streamed | `app/api/ai/convo/route.ts`, `components/topic/convo-mode.tsx` |
| **Settings** | `persona_name`, `ai_suggestions`, `default_mode` | table `user_settings`, `lib/queries/settings.ts` |
| **Rediscover** (spin to a random topic) | Live. NOT Discover. | `rediscover()` in `lib/actions/topics.ts`, bottom tab |
| **Glints** (inward: resurface EXISTING topics) | Planned, not built | `docs/FUTURE_FEATURES.md` section 8 [2.0 rename: this inward-surfacing mechanic is now the **resurfacing engine**, living in the Library; the word "glint" now means the daily capture. See MAGPIE_2.md C.4, C.12.] |
| **Feedback / preference signal store** | **Does not exist** | (greenfield) |

Two things worth internalizing:

1. **`acceptDiscoverItem(id, subjectId)` already turns an idea into a topic.** So "like an idea" has a natural existing meaning: file it into the grid. Decide whether "favorite" means exactly that (becomes a topic) or a lighter save (a favorites list that is not yet a full topic).
2. **No prompt takes preference context today.** `briefPrompt`, `challengePrompt`, etc. receive only `{ title }`. Conditioning Maggie means adding an optional preference argument to those factories and a source to fill it. This is the real new surface area.

---

## The four decisions to make before scoping (the forks)

### 1. Shared account vs per-user. THE big one.
"Trains Maggie for **user** preferences" is per-user by definition, but today everyone rides the one shared `dogsled@dogsled.dev` account, so every like/dismiss pools community-wide. The RLS for per-user accounts already exists (deferred). Three paths:
- **(a) Forcing function:** this feature is the reason to finally ship per-user accounts. Cleanest product story, biggest lift.
- **(b) Community taste:** likes/dismisses shape one shared Maggie for the whole community nest. Small lift, but "your preferences" becomes "our preferences."
- **(c) Device/session-local stopgap:** store the preference signal client-side per visitor until per-user lands. Keeps the shared account, no real personalization.

Everything downstream (schema ownership, RLS, where favorites live) depends on this. Recommend deciding this first.

### 2. Reconcile with the roadmap: Discover vs Glints vs new.
The roadmap already draws a sharp line (`FUTURE_FEATURES.md` section 8):
- **Discover** = outward, propose NEW topics to add. Verbs: Add / Skip. Your "Maggie gives ideas → like/dismiss" IS this.
- **Glints** = inward, resurface topics you ALREADY have to revisit. Different verb, different copy.
- Your "like/dismiss on Brief and Challenge" is a third thing: a thumbs up/down **on generated content**, not an idea to add.

Do not merge these. Decide: is the ideas feed the Discover tab reawakened, and is the preference signal shared across Discover + Brief/Challenge, or scoped per surface?

### 3. "Training" = in-context conditioning, not fine-tuning.
On the Claude API, "trains Maggie" realistically means feeding liked/dismissed signal into the generation prompt. Two implementations, can stage:
- **(a) Simple, first:** aggregate recent liked / dismissed titles and inject them into the idea + Brief + Challenge prompts ("the user tends to like X-shaped topics, tends to dismiss Y").
- **(b) Richer, later:** the "user context summary" from `FUTURE_FEATURES.md` 7d: a weekly Sonnet rollup of likes/dismisses/recent thoughts, cached and prepended. Better signal, more moving parts.

### 4. Where like/dismiss lives, and where a favorite goes.
- **Ideas feed:** a reawakened Discover surface (there is no route today). Like = accept, dismiss = skip.
- **Brief / Challenge:** add like/dismiss next to the Reroll button in `components/topic/text-mode.tsx`.
- **Favorites:** new surface. Its own tab? A pin on the topic? A `favorites` facet? Undecided.

---

## Proposed shape (options, not locked, for you to react to)

**Schema**
- A generic feedback table, target-agnostic so it covers ideas AND Brief/Challenge:
  ```sql
  create table content_feedback (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    -- what got rated:
    target_kind text not null check (target_kind in ('idea','brief','challenge')),
    topic_id uuid references topics(id) on delete cascade,   -- for brief/challenge
    discover_item_id uuid references discover_items(id) on delete cascade, -- for idea
    verdict text not null check (verdict in ('like','dismiss')),
    created_at timestamptz default now()
  );
  ```
- For ideas specifically, `discover_items` already has `status` (pending/accepted/skipped), so likes/dismisses on ideas can ride that column and the feedback table can stay Brief/Challenge-only. Pick one home for the idea signal, not two.
- Extending idea generation to cache would need the `ai_cache` `mode` CHECK widened (add `'ideas'`), OR keep ideas in `discover_items` and leave `ai_cache` alone (cleaner).

**Queries:** extend `lib/queries/discover.ts` (generation + list); new `lib/queries/feedback.ts` (record + aggregate). Keep the single-source-of-truth spine per `CLAUDE.md`.

**Prompts:** add an optional `preferenceContext?: string` to `briefPrompt`, `challengePrompt`, and a new `ideasPrompt` in `lib/ai/prompts.ts`. Build the string from aggregated feedback.

**UI:** like/dismiss controls in `components/topic/text-mode.tsx`; a Discover/Ideas feed page + bottom-tab entry; a favorites surface (TBD per decision 4).

**Preference builder:** start with decision 3(a) (aggregate titles inline), leave 3(b) (weekly summary) as a follow-up.

---

## Touchpoint index (where the work lands)

- Schema / migration: new `content_feedback` table (+ maybe widen `ai_cache` mode), in `supabase/migrations/00xx_*.sql`
- `lib/queries/discover.ts`: generation + listing (exists, dormant)
- `lib/queries/feedback.ts`: NEW
- `lib/ai/prompts.ts`: `ideasPrompt` NEW; add `preferenceContext` to brief/challenge
- `app/api/ai/*`: an ideas route; brief/challenge routes unchanged except prompt input
- `components/topic/text-mode.tsx`: like/dismiss next to Reroll
- Discover feed page + `components/nav/bottom-tab-bar.tsx`: NEW surface
- `lib/queries/settings.ts` / `user_settings`: if preference toggles or the account-model decision touch settings

---

## Open questions for you (answer these when you scope)

1. Account model: (a) per-user accounts, (b) community taste, or (c) device-local stopgap? (Decision 1.)
2. Does "like an idea" mean "add it as a topic" (current `acceptDiscoverItem` behavior) or a lighter save to a favorites list?
3. Is the preference signal shared across ideas + Brief + Challenge, or per-surface?
4. Training: start with simple inline aggregation (3a), or go straight to the weekly summary (3b)?
5. Where do favorites live: own tab, topic pin, or a `favorites` facet?
6. Do ideas get generated on demand (open the feed) or pre-generated on a schedule (cron), Readwise-daily style?
7. Does dismissing decay (comes back later) or is it permanent? (Readwise decays; roadmap favors decay.)

---

## What NOT to do

- Do not build a parallel surfacing system next to Glints. Reconcile first (decision 2).
- Do not promise or imply model fine-tuning. It is in-context conditioning.
- Do not ship per-user preference semantics on the shared account without settling the account model. It will read as broken ("why did my Maggie change") when it is really everyone's signal pooling.
- Do not duplicate the idea signal in both `discover_items.status` and a feedback table. One home.
