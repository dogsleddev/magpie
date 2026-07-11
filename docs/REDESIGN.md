# Magpie 2.0 Redesign: the entity spine

_Synthesized 2026-07-11 from a multi-agent design pass (entity model + Maggie + Library + adversarial critique + synthesis). This is the working spec for the glint + entity-rollup redesign. Additive on migration 0008. Companion mockups were published as a Claude artifact. Supersedes nothing yet; slices land per section 5._

---

# Magpie Redesign Spec: Entities, Maggie, Library

One coherent spec. The three source slices (entity model, Maggie, Library) and the adversarial critique are reconciled inline: where the slices contradicted, one winner is chosen and stated. Everything is additive on migration head 0008, dogfoodable on the shared `dogsled@dogsled.dev` account, and mobile-first at 375px. Maggie's voice is lowercase. No em dashes anywhere.

---

## 1. The model in one page

Four nouns. Three are live today; **entity** is the new connective spine.

| Noun | What it is | Cardinality to a glint | Who makes it |
|---|---|---|---|
| **Glint** | a curiosity in the user's own words (~5-6 word median, verbatim, never renamed into a tag). A glint IS a `topic` row. | itself | the user, on catch |
| **Entity** | what the glint is *about*: a noun hub (wolves, Yellowstone, Stoicism, Red Rising). A rollup hub that gathers every glint touching it. | **many-to-many** | Maggie extracts, user can correct |
| **Facet** | the *angle / lens* (paradox, evolution, ethics). Cross-cutting. Unchanged from today. | many-to-many | Maggie extracts |
| **Subject** | the coarse home bucket (History, AI, Sports). `topics.subject_id` stays NOT NULL. | one (unchanged) | Maggie picks |

**Entity is the about-ness (noun). Facet is the angle (lens).** They never share a table and a word that is a lens (ethics, paradox) must route to facets, never to entities (resolved from critique #8).

Entities **nest** into broader entities as a many-to-many DAG (wolves rolls up under predators; a glint under wolves is transitively under predators). This generalizes the rare manual `is_group` groups (Red Rising, Corvids) into the default structure.

```
                         SUBJECT  (coarse home bucket, 1 per glint, unchanged)
                            |  subject_id NOT NULL
                            v
   FACET  <--(m:n)--  [   GLINT = topic   ]  --(m:n)-->  ENTITY  ---.
   (lens/angle)        the user's words                 (noun hub)   |  (m:n DAG)
                                                             ^        v
                                                             '--- broader ENTITY
                                                                  (wolves -> predators)

  one glint:  "wolves reshape the rivers in yellowstone"
     rolls up under  ENTITY wolves   AND   ENTITY yellowstone     (both, many-to-many)
     carries lens    FACET cause and effect
     lives in        SUBJECT history
     wolves nests in ENTITY predators ;  yellowstone nests in ENTITY national parks
```

The payoff the whole redesign turns on: a connection is now **honest**. "connects to your bison glint, both about yellowstone" is true because both glints share the yellowstone hub. Connections stop being fuzzy title guesses and become an explainable join.

---

## 2. Schema + migration plan

### 2.1 The schema decision (resolves critique #1, the deepest fault)

The two source slices shipped **incompatible** `entities` tables under the same number. This spec ships the **entity-model slice's schema verbatim** and discards the Maggie slice's single-parent `parent_entity_id` version. Reasons, decisive:

- Many-to-many glint↔entity is a hard requirement; a single nullable FK cannot hold a second membership.
- Nesting is a DAG (an entity rolls up under several broader ones); a single `parent_entity_id` cannot express it, and the Library's "part of / narrows to" walks both directions of that DAG.
- Dedup needs a `canonical_key` (so "Yellowstone", "yellowstone", "yellowstone " collapse). Uniquing on raw `name` fractures every rollup.

### 2.2 `0009_entities.sql` (additive, non-breaking)

Four new tables, modeled on the proven `facets` / `topic_facets` pattern, RLS in the 0001 `"Own X: verb"` style, everything `if not exists`, nothing dropped or rewritten. The ~171-topic shared account is untouched.

- **`entities`**: per-user canonical hubs. `id, user_id, name, canonical_key, created_at`, `unique(user_id, canonical_key)`, index on `user_id`. Four owner-only RLS policies on `auth.uid() = user_id`.
- **`topic_entities`**: the many-to-many join. `topic_id, entity_id, created_at`, PK `(topic_id, entity_id)`, index on `entity_id`. **No own `user_id`**: ownership derives through the topic, exactly like `topic_facets`. Policies: select/insert/delete only (no update). Insert additionally checks entity ownership so a user cannot link a topic to someone else's entity id.
- **`entity_parents`**: nesting DAG. `child_entity_id, parent_entity_id, created_at`, PK `(child, parent)`, `check (child <> parent)` (blocks self-loops only), index on `parent_entity_id`. Ownership derives through the child entity.
- **`entity_aliases`**: variant key → canonical entity, for dedup. `user_id, alias_key, entity_id, created_at`, PK `(user_id, alias_key)`. `user_id` denormalized so RLS stays trivial.

The full DDL is the entity-slice `0009_entities.sql` block, taken as-is. Since 0008 columns are not yet in the generated `Database` types, entity writes use the same narrow-cast pattern `setGlintSeed()` already uses until types are regenerated.

**`conversations` gets no `entity_id` in slice one** (resolves critique #2). An entity is not a topic and `conversations` keys on `topic_id`, so a hub-level "talk it through" has no storage row. Rather than add an FK and a synthesis path that the Maggie tab-merge is simultaneously dismantling, hub-level convo is **cut from slice one** and listed as an open decision (§6). This keeps 0009 purely structural.

### 2.3 Normalization, dedup, find-or-create

`normalize(name)` = trim → lowercase → strip punctuation (keep `\p{L}\p{N}\s`) → collapse whitespace → strip a **tiny, curated** suffix/prefix list (`"national park"`, leading `"the "`), extended only cautiously. This is the `titleKey` folding already in `glints.ts:36` plus a small suffix strip.

`findOrCreateEntity(name)` mirrors `findOrCreateFacet`, including the **23505 re-read on race** (do not trust the unique index alone under shared-account concurrency, resolves gap from critique #5):

1. `key = normalize(name)`.
2. Match `entities.canonical_key = key` for the user → reuse.
3. Else match `entity_aliases.alias_key = key` → resolve to `entity_id` → reuse.
4. Else insert `entities(name, canonical_key=key)`; on `23505` re-read.
5. If Maggie mapped a longer surface form onto a canonical hub, record the variant: `insert entity_aliases(alias_key=normalize(surfaceForm), entity_id) on conflict do nothing`.

**The primary dedup lever is prompt-time reuse, not string folding** (resolves critique #8b): the extractor is handed the user's existing entity names via a new cheap `getEntitiesLite()` and instructed to reuse an existing hub verbatim before minting a new one. String folding will never merge `wolf`/`wolves` or `Stoicism`/`the Stoics`; that residual gap is accepted and cleaned up later by a Library merge affordance (§6).

**Stoplist (resolves critique #8a):** the extractor prompt carries a stoplist of lens words (paradox, ethics, evolution, future, etc.) and vacuous nouns (life, things, the world, stuff). A lens word that comes back is routed to `topic_facets`, never `entities`. A vacuous noun is dropped.

**Cap (resolves critique #8c):** entities per glint are capped in code at **3** (`.slice(0, 3)`), median target like the 5-6 word glint, enforced by the slice, not just cited.

### 2.4 Cycle prevention (resolves critique #14)

The `check` only blocks self-loops; A→B→A is insertable and would break every recursive walk. `addEntityParent` walks the proposed parent's ancestors and refuses if the child appears. All recursive reads (rollup counts, nesting chips, future Nest) use `WITH RECURSIVE ... CYCLE` as belt-and-suspenders. This work is budgeted as part of the entity-editing action set (§3.4).

### 2.5 Backfill (`scripts/backfill-entities.mjs`, dry-run default, `--write`)

Style of `scripts/merge-dupes.mjs`: idempotent, reversible (delete join rows), zero destructive topic rewrites.

- **Phase A: lift existing groups (deterministic, zero model calls).** For every `is_group=true` topic (Red Rising, Corvids), `findOrCreateEntity(title)`; for every child (`parent_topic_id` = that group), `insert topic_entities(child, entity) on conflict do nothing`. Group topics keep existing so current group pages stay live; they are already excluded from riffable queries by `is_group=false`.
- **Phase B: extract entities for the ~168 plain topics (batched Haiku).** Run the §3 extractor over each title, feeding each call the growing entity list so later topics reuse earlier hubs and the graph self-densifies. Resolve via `findOrCreateEntity`, link `on conflict do nothing`. Idempotent: re-runs fill gaps. Optionally seed `entity_parents` from returned `broader`.
- **Phase C: subjects as broad entities (deferred).** Mirror each of the 15 subjects into an entity + `entity_parents`. Purely additive, only if the Nest/Library wants one unified walkable graph. Not in slice one.

**Timestamp invariant (resolves critique #9):** `topic_entities.created_at` is **link time, not glint time**. Because Phase B links all 168 old topics today, every recency/temporal read (resurfacing, Time lens, "you first caught this 3 weeks ago") MUST read `topics.created_at` (and `thoughts.created_at`), never `topic_entities.created_at`. This is a query-spec invariant, not a footnote.

### 2.6 The write seam (resolves critique #12)

Before 0009 lands, confirm the real choke point in `glints.ts` / `topics.ts`. `captureGlint` already imports `addTopicViaMagpie`; the entity write goes at the **single shared point both capture and manual-add cross** so neither path is missed and neither double-runs. All entity writes are wrapped in try/catch exactly like `applyUmbrella` and the seed/title writes: **an extraction failure never blocks the catch.** The write happens after the optimistic commit, never on the critical path, and is skipped when over `AI_ADD_BUDGET` (glint still created).

### 2.7 Transition posture for the old umbrella

New captures write both the entity links (new spine) and, for now, still run `applyUmbrella` so group pages don't go dark. Once the Library reads entities and group pages re-point at entity hubs, freeze `is_group` writes. Tracked as a follow-up (§6) so dual-write does not become permanent.

---

## 3. Maggie redesign

### 3.1 The one idea

`captureGlint` already creates the glint, keeps the user's words, ticks the streak, and computes connections against a pre-catch snapshot. The redesign (a) changes what "connection" means (shared extracted entities, not fuzzy title matching), (b) surfaces entities as a visible, tappable, correctable layer, and (c) later, separately, folds the five topic tabs into one Maggie thread.

### 3.2 One model call, not a fifth promise (resolves critique #10)

Entities fold into the **single existing** `categorizeTopicPrompt`, which today returns `{title, subject, facets, group}` and is already handed the user's subjects/facets/topics lists. It gains:

```jsonc
"entities": [ { "name": "wolves",     "broader": "predators" },
              { "name": "yellowstone", "broader": "national parks" } ],
"split":    null   // or [ {glint, entities}, ... ] when it smells like 2-3 curiosities
```

The parallel batch **stays at 4 promises**; categorize simply returns more. `broader` is optional and conservative (only an obvious, stable superset, like the umbrella's "never build a group around nothing"). `group.name`, when present, also maps onto an entity, so the umbrella signal is subsumed during transition.

### 3.3 Connections: augment, do not replace (resolves critique #4)

Shared-entity connections can only fire when *other* glints already have entities, which is false on a fresh account and only true after backfill Phase B. So:

- Compute connections as "other glints sharing ≥1 entity hub" (a join, deterministic, explainable, renders the instant entities resolve).
- **If the join returns zero, fall back to the existing fuzzy matcher** so early/cold glints still get a connection chip (the core "see it connect" payoff).
- Gate the full swap-out of the fuzzy matcher behind "backfill Phase B done AND median glint has ≥1 entity." Backfill-before-launch is an explicit sequencing dependency.

### 3.4 Capture states A→D (Home `/home`, optimistic-first)

The caught card is four states in one card, each replacing the last in place, never a spinner-blocked screen.

| State | Trigger | Card content | Editable |
|---|---|---|---|
| **A echo** | submit (local, 0ms) | `caught: {raw words}` + `reading it...` | no |
| **B entities** | categorize returns (~400ms) | entity chips (`× ` / `+ add`), split banner if any | yes |
| **C connect** | join returns (with/just after B) | `connects to {glint} · both about {entity}` chips | tap-through |
| **D settled** | both resolved | quiet, all links live | tap-through |
| error | throw | restore input + streak (as today); if only extraction throws, skip to a State-D card with no entity row, glint still saved, streak still counts | retry |

State B is the load-bearing new moment. Chips are teal-outlined pills (`rounded-full border px-2.5 py-1 text-xs`). `×` drops that entity from *this glint* (removes the join row, optimistic; does not delete the hub). `+ add` opens an inline combobox seeded from `getEntitiesLite()` (typeahead over existing hubs so reuse beats proliferation). Editing is allowed, never required.

**Facets stay out of the catch card** (resolves critique gap): entities show here (what it's about); facets are still *written* silently as today, surfaced only in the Library / topic detail (the lens layer). This keeps the card uncluttered.

### 3.5 The split affordance

When `split` comes back non-null (heuristic: line breaks or explicit "and also"; start conservative, false splits nag), State B shows a slim dismissible banner above the entity row:

```
looks like you caught a few things here.
[ keep as one ]   [ split into 3 ]
```

Default is **keep as one** (matches locked "default: one"). `split into 3` expands a stacked editable preview, each row a proposed glint in lowercase voice with its own entity chips, each deletable/editable, then `[ catch all three ] [ cancel ]`.

**Streak integrity (resolves critique #11):** State A already ticked the streak once for the raw catch. The split-commit path uses a `countsForStreak:false, skipExtraction:true` variant that reuses the already-resolved entity hubs and creates topics only. **One catch = one streak tick**, regardless of how many glints the brain-dump fans into. The fanned glints share the resolved hubs so they connect to each other immediately.

### 3.6 Entity editing: the write path (resolves critique #7)

Inline remove/add at capture is shipped in slice one (it is the load-bearing State-B moment), so the Library's "can the user edit?" open question is answered here. Server actions, all with insert-with-check RLS running **server-side, never client**:

- `addTopicEntity(topicId, name)` → `findOrCreateEntity` + `insert topic_entities`.
- `removeTopicEntity(topicId, entityId)` → `delete topic_entities` (hub survives).
- `renameEntity`, `mergeEntities`, `addEntityParent` → **deferred to the Library**, not slice one.

**Shared-account caveat:** on `dogsled@dogsled.dev`, one person's `× wolves` mutates the glint for everyone. This is acceptable for the community-curation launch mode (same as topic edits/deletes today) but is flagged in §6.

### 3.7 The tab-merge (LAST, separate slice: resolves critique #15 and #5)

The five topic tabs ({persona} / Brief / Challenge / Questions / Convo) collapse into one Maggie thread where Brief/Challenge/Questions become **offered moves inside the conversation**, not destinations. On open Maggie leads with a brief-as-opener (seeded from `brief_seed`), lowercase, then three suggestion chips: `[ push me ]` (Challenge, Sonnet), `[ ask me things ]` (Questions, Haiku), `[ i'll just talk ]` (free capture).

**Do not blanket-write chat into `thoughts` (resolves critique #5).** The old {persona} mode captured deliberate curated bullets; writing every conversational turn into `thoughts` would pollute the very "come back to your own words" notes surface the merge preserves. Rule: **only turns entered under `i'll just talk` are saved as thoughts.** Ordinary replies to Maggie's Challenge/Questions are conversation, not bullets. The notes list stays curated.

Two surfaces survive as their own non-chat views: the **notes list** (quiet, editable, ordered bullets, reached via a `notes` link in the topic header) and **brief** as a `re-read the brief` link at the top of the thread. Net: five tabs → one thread + one notes view + one brief link.

This slice is **explicitly last and separate** because it changes the daily capture ritual and can regress the "keep my words" soul. It requires no migration (storage already exists: `conversations.messages`, `thoughts`, `ai_cache`). It degrades safely: AI off → thread is just the notes surface with a capture box.

### 3.8 Entity-aware chat

The opener prompt gets one extra field: the glint's resolved entities plus, per entity, the count and one example title of other glints under it (a `getEntitiesLite()`-style read). Maggie speaks a connection **only when that count > 0**, so she never hallucinates a memory. Inward voice, once, low-key:

```
maggie
this one touches yellowstone, same as your bison glint from last week.
want me to connect them or keep this its own thing?
```

The entity noun links to its hub in the Library; the connected glint links to that topic. Nesting shows as gentle widening ("this is really a national-parks thread forming"), suggested, never automatic reparenting.

**Shared-account voice fix (resolves critique #6):** on the shared account the graph is the community's, so first-person "you keep returning to..." is false. Until private accounts land, entity-memory copy on shared accounts is either phrased communally ("this nest keeps touching yellowstone") or gated off via the existing Glints toggle (default-off on shared). All inward-voice copy in this spec is written for the single-user world that is not live yet; it must switch to communal phrasing on shared accounts.

### 3.9 Key Maggie screens

**Screen M1: Home, capture mid-flow (State B + split), 375px, `max-w-md`, `px-4`:**

```
12                    days streak · best 19     (header, live)
[ what caught your eye today?            ] [catch]

caught: wolves reshape the rivers in yellowstone     (verbatim, text-sm)

looks like you caught a few things here.              (split banner, purple-tint, dismissible)
[ keep as one ]  [ split into 3 ]

about  [ wolves × ]  [ yellowstone × ]  [ + add ]     (entity row, teal pills)

connects to bison keep the valley open                (connection chip)
  · both about yellowstone                            (dim suffix = the entity model made visible)

▪▪▪▪▪▫▪  ▪▪▫▪▪▪▪                                      (activity strip, live)
[ Today   Grid   Facets   Nest   Library ]            (bottom bar, §5)
```

**Screen M2: Topic as one Maggie thread (the deferred merge):**

```
‹ back                    re-read brief · notes

wolves reshape the rivers in yellowstone        (title, font-display text-2xl)
about  wolves · yellowstone                     (entity line, text-xs dim, each tappable)

[ maggie ] ok, wolves and rivers. the wild part is they never
           touched the water. want the tension in it, or just talk?
  [ push me ]  [ ask me things ]  [ i'll just talk ]

                     [ you ] i keep thinking it's really about elk behavior

[ maggie ] right, the elk are the actual lever. that touches your
           bison glint too, both about grazing. connect them?

[ say it...                                   ] [ mic ]    (composer, sticky)
```

Only `i'll just talk` turns save as thoughts. `push me` / `ask me things` call the existing Challenge / Questions prompts inline.

---

## 4. Library redesign

### 4.1 The Library's job

A pull-based, browsable home for everything caught, spined by entities. It replaces the random **Rediscover** tab. Random spin survives as a small dice gesture inside it, not a whole tab. It answers three questions: *what have I been into* (hubs by richness), *what did I say about X* (drill a hub), *what have I forgotten* (resurfacing). It is reading and wandering; it never pushes.

### 4.2 Navigation: minimal path, not the full consolidation (resolves critique #3)

The two source slices defined the bottom bar three different ways. This spec adopts the Library slice's own **minimal path** as the slice-one contract:

- **Bottom bar:** `Today · Grid · Facets · Nest · Library` (Library simply replaces Rediscover).
- **No `Add` tab** (capture stays on Today, the whole 2.0 daily loop).
- **Grid and Facets stay standing** in slice one, so `/app`, `/facets/[id]`, the facet chips that link to `/facets/[id]`, and the landing's "five modes" copy do not break.
- Consolidating Grid + Facets into Library lenses, route redirects, and the landing rewrite are **deferred** to a later pass once the Library proves out.

Slice one ships the **Hubs lens only**. Facets/Subjects/Time lenses are the follow-on. This is the smallest coherent diff.

### 4.3 The lenses (Hubs first; others follow)

One tab, lenses via a segmented control on the same catch set. Hubs is default and primary.

| Lens | Shows | Sort | Slice |
|---|---|---|---|
| **Hubs** (default) | entity rollup rows with glint counts | glint count desc, recency tiebreak | one |
| **Time** | reverse-chron feed, this week / last week / earlier | newest first (via `topics.created_at`) | one, as cold-start fallback |
| Facets | existing lens tags with counts | count desc | later |
| Subjects | coarse buckets | position / count | later |

**Cold start (resolves critique gap):** with few glints there are no rich hubs and no resurfacing, and a `≥2-glint` display floor would blank the Library. So when the user has fewer than **N=5** glints, the Library **defaults to the Time lens** and hides the resurfacing strip. Above N, Hubs is default.

Search sits above the lenses (matches glint text + entity names + facet names), placeholder `search your glints`. Shuffle is a small dice icon in the header (old Rediscover, demoted to a gesture).

**Group anchors render as hubs, never as riffable glints (resolves critique gap #10):** `is_group` topics (Red Rising, Corvids) are filtered out of riffable lists today; the query seam must surface them only in the Hubs lens and never in Time/search as glints. Their mirror entities carry their members.

### 4.4 Resurfacing (inward, computed, optional)

Built entirely on the entity rollup, derived at request time (like `findConnections`), no resonance table. Three patterns, all lowercase, all pull:

1. **Return**: "you keep returning to predators" (a hub that keeps re-accruing, recency-weighted count over a threshold that fires rarely enough to feel earned).
2. **Rollup count**: "3 of your glints touch yellowstone" (a hub crossing a threshold).
3. **Temporal echo**: "you wrote about this when..." (two glints sharing a hub across a time gap, computed via `topics.created_at`).

Rules (brand-locked): pull never push (appears only inside surfaces the user opened; never a notification/badge/email), optional (reuses the Glints toggle), inward voice only (reminds you of *your own* past; tappable text, no Add/Skip). On the **shared account** these read communally or are gated off (per §3.8).

### 4.5 Nest vs Library (resolves critique #13)

Library and Nest read the same entity graph but with different posture: Library is the calm linear reading room, Nest is the spatial constellation. **The "two views of one dataset" claim is softened for slice one** because `lib/nest/build-graph.ts` models Subject→Topic containment + Facet web + Resonance and does *not* know about entities yet. So:

- Slice one: **no `see as nest` seam.** The Nest keeps rendering its current three dimensions.
- The Nest entity rewire (teach `build-graph.ts` the entity graph, then wire the `see as nest` / node→hub seam) is its **own explicit follow-up slice**, not bundled with the entity spine.

### 4.6 Hub-level "talk it through" (resolves critique #2)

Cut from slice one. An entity has no conversation storage row (`conversations` keys on `topic_id`), and the tab-merge is dismantling per-topic Convo simultaneously. Entity-level synthesis is an open decision (§6): either add `conversations.entity_id` later or leave hubs read-only.

### 4.7 Key Library screens

**Screen L1: Library home (Hubs lens, primary):**

```
Library                                    🎲     (Fraunces 2xl; dice = shuffle)
everything you've caught.                          (Fraunces italic, dim)

[ 🔍  search your glints                        ]

[ Hubs ]  Facets  Subjects  Time                  (segmented; active = teal underline)

[ resurface ]                                      (purple-tint card, whole thing tappable)
  this nest keeps returning to predators           (communal phrasing on shared account)
  wolves · apex hunters · ravens

hubs
[ ▚ yellowstone                        7 glints ]  (Layers glyph if nested; count = teal pill)
    wolves reshape rivers · the 1995 reintroduction   (preview line, dim)
[ ▚ predators                          6 glints ]
    narrows to: wolves, orcas
[   stoicism                           4 glints ]
    what marcus got wrong ·
[   red rising                         3 glints ]
    … quieter hubs below …
[ Today   Grid   Facets   Nest   Library ]         (Library active = teal)
```

Row: `rounded-xl border p-3 bg-bg-card`, hover lift -1px. Count = teal-tinted `rounded-full px-2 text-xs` pill. Preview = up to two child glint titles joined by `·`, truncated. Nested hubs get the `▚` glyph + a `narrows to:` / `part of:` micro-line.

**Screen L2: Entity hub detail (drill-down):**

```
‹ library

yellowstone                                        (Fraunces 2xl)
7 glints · part of: places                         (meta, dim; parent tappable)

you first caught this 3 weeks ago, and again on tuesday.   (resurface, via topics.created_at)

narrows to  ⌄
( wolves )  ( geysers )  ( bison )                 (nested-entity chips, tap → that hub)

facets here
( evolution )  ( paradox )

glints
[ wolves reshape rivers here                     ]
  history · 3 weeks ago                            (subject · relative date via topics.created_at)
[ the 1995 reintroduction                        ]
  history · tuesday
    … 5 more glints …
[ Today   Grid   Facets   Nest   Library ]
```

Each glint row taps to its topic page (Screen M2). `part of:` / `narrows to:` chips walk the DAG both ways. No hub-level convo button in slice one.

**Screen L3: Time lens (cold-start default and "what have I been up to"):**

```
Library                                    🎲
everything you've caught.
[ 🔍  search your glints                        ]
 Hubs  Facets  Subjects  [ Time ]

this week
[ why orcas hunt in dialects                     ]
  predators · orcas · today                        (up to 2 hub tags, teal-dim, tappable)
[ marcus aurelius journaled to self              ]
  stoicism · tuesday

last week
[ wolves reshape rivers here                     ]
  yellowstone · wolves
earlier
    … older glints …
[ Today   Grid   Facets   Nest   Library ]
```

Chronological, same catch set, hub tags inline so the entity spine is always one tap away.

---

## 5. Phased build order

Sequenced so each slice is independently shippable and keeps the daily capture loop dogfoodable. Additive-only throughout. The tab-merge is deliberately last and separate because it is the only slice that can regress the capture ritual.

**Slice 1: Entity spine + capture chips (the coherent first cut).**
- `0009_entities.sql` (4 tables + RLS), regenerate types.
- `findOrCreateEntity` (23505 re-read), `getEntitiesLite`, stoplist + `.slice(0,3)` cap, cycle guard in `addEntityParent`.
- Extend `categorizeTopicPrompt` to return `entities[]` + `split` (batch stays at 4). Write links at the shared `addTopicViaMagpie` seam, best-effort, off the critical path, inside `AI_ADD_BUDGET`.
- Backfill script Phases A + B (dry-run, `--write`), run on the shared account.
- Connections: shared-entity join with **fuzzy fallback** (augment, not replace).
- Capture card States A→D, entity chips with inline `× / + add` (`addTopicEntity` / `removeTopicEntity` server actions), split affordance with `countsForStreak:false, skipExtraction:true` commit.
- Verify: catch a glint, see entities, correct one, see an honest connection. Streak ticks once even on a 3-way split.

**Slice 2: Library, Hubs lens (pays for the tab it replaces).**
- Swap `Rediscover → Library` in the bottom bar. Grid + Facets stay.
- Hubs lens (rollup counts via group-by over the join), hub detail (L2), search.
- Time lens as cold-start fallback (N=5). Resurfacing strip, read-only, communal phrasing / default-off on shared account. All recency via `topics.created_at`.
- Group anchors surface only as hubs.

**Slice 3: Nest entity rewire.**
- Teach `lib/nest/build-graph.ts` the entity graph; wire `see as nest` (Library → focused Nest) and node → hub. Only now is the "two views, one wire" claim true.

**Slice 4: The tab-merge (last, alone).**
- Collapse five topic tabs into one Maggie thread; offered-move chips; entity-aware opener; `i'll just talk` turns save as thoughts, replies do not; notes view + `re-read brief` link survive.
- Once live and the Library reads entities: re-point group pages at entity hubs, freeze `is_group` writes, retire `applyUmbrella` dual-write.

**Deferred (own passes):** Grid/Facets consolidation into Library lenses + route redirects + landing "five modes" rewrite; Facets/Subjects lenses; `mergeEntities` / `renameEntity` Library affordances; Phase C subjects-as-entities; hub-level convo.

---

## 6. Open decisions for Chris

These are the real forks, each with a recommendation.

1. **Hub-level "talk it through" storage.** Cut from slice one (no conversation row for an entity). Later: add `conversations.entity_id nullable` + RLS and keep an entity-synthesis prompt path, OR leave hubs read-only forever. **Recommend:** ship read-only hubs first, revisit after slice 2 shows whether people want to riff a whole hub.

2. **Auto-connect semantics.** When Maggie says "connect them?", *yes* does what? They are already connected via the shared hub, so the honest options are (a) nothing, or (b) add the *missing* shared entity to one glint ("you both touch grazing too"). **Recommend (b):** "connect" = a one-tap join add, so the word does real work.

3. **Shared-account inward voice.** Every entity table keys on `user_id`, but launch is the shared account, so "you keep returning to..." is the community's graph in a first-person voice. **Recommend:** communal phrasing on shared accounts ("this nest keeps..."), and default the resurfacing/Glints toggle **off** on shared. Switch to true first-person only when private accounts land.

4. **Entity granularity + merge affordance.** `wolf`/`wolves`, `Stoicism`/`the Stoics`, `Yellowstone`/`Yellowstone National Park`. String folding + prompt-time reuse catches most; the residual gap needs a human. **Recommend:** ship auto-extraction now, add a light "merge these two hubs" affordance in the Library (slice 2+), model-*proposed* merges only, reversible (delete an alias row, never a destructive topic rewrite).

5. **Nesting authoring.** Who creates `wolves → predators`? **Recommend:** Maggie proposes on extraction, one-tap accept in the Library, never automatic reparenting (auto risks a messy tree; user-only risks it never happening).

6. **Cold-start threshold N.** The Library defaults to Time lens and hides resurfacing below N glints. **Recommend N = 5.** Cheap to change; pick a number so the shared account (168 glints) is always in Hubs and a fresh private account is not staring at empty hubs.

7. **When to retire the umbrella.** Dual-writing `applyUmbrella` and entity links is two sources of truth. **Recommend:** cutover at the end of slice 4 (Library reads entities, group pages re-pointed at hubs), then freeze `is_group` writes. Track it so dual-write does not become permanent.

8. **Full "just chat" mode after the merge.** The tab-merge assumes the thread *is* Convo. If you want a distraction-free chat, that is a display toggle on the same thread, not a second data path. **Recommend:** ship the merged thread first, add a toggle only if the thread feels too busy in dogfooding.