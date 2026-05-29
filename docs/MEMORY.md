# Magpie · Memory and Context

How Maggie's awareness of the wider wiki grows over time, and how she handles that awareness in conversation. Both halves matter equally: the *infrastructure* that gives her cross-context, and the *pacing* that keeps her from misusing it.

This doc is the source of truth for both. Updates to either model live here.

---

## The four levels of cross-context

Maggie's conversational awareness grows in four levels, each building on the last. Each level is a distinct phase in the build plan, and each unlocks specific product surfaces.

### Level 1: Within-topic context (v1, already shipped in code)

Maggie's Convo on a topic knows about that topic's prior conversation history (the JSONB messages array on conversations) and the bullets you've captured in Maggie mode for that topic. Today, no cross-anything. This is the baseline.

Code lives in: lib/ai/prompts.ts (convoSystemPrompt), lib/queries/conversations.ts.

### Level 2: Within-group context (Phase 4.5)

When Option 2 (topic groups) ships, Maggie's Convo on a group's child topic gets told about sibling threads via the system prompt. Example: in a Red Rising group with threads on "the color caste system," "how the Society governs," and "the Howler chapter," Maggie's Convo on any one thread receives a short summary of the other threads as background context.

Implementation: when loading the Convo route handler, fetch sibling thread titles and a one-line summary of recent thoughts from each, inject into the system prompt. Roughly 200-300 tokens per Convo call. Negligible cost, real conversation-quality impact.

Group-level Convo (on the group itself, not a child) gets ALL threads as full context. This is the cross-thread synthesis surface that justifies Option 2 in the first place.

Code touches: lib/ai/prompts.ts (new buildConvoSystemPrompt that accepts group context), lib/queries/topics.ts (new getGroupChildren and getGroupSummary).

### Level 3: Cross-topic via facets (Phase 6 or 7)

When a Convo starts on any topic, query for other topics that share at least one facet with the current topic, pull their titles and a thought summary, inject into the system prompt. Maggie now feels like she's seen your whole wiki, even though she's only being told about the relevant facet neighborhood.

This is a SQL join, no new infrastructure. The query is bounded (~5 most-related topics, ~50 tokens each in the prompt). Easy to ship as an upgrade to Level 2.

Code touches: lib/queries/topics.ts (new getTopicsByFacetOverlap), lib/ai/prompts.ts (extended context shape).

### Level 4: Cross-topic via embeddings (Phase 8 or v1.5)

Migrate from facet-based context to semantic search via pgvector. Every thought and every conversation message gets embedded into pgvector (Supabase supports this natively). When Maggie is responding, the route handler does a semantic similarity search across all of the user's content and pulls the top 5-10 most semantically related items, regardless of topic or facet.

This catches the cross-topic connections that facets miss. Pgvector is free with Supabase. Embeddings are cheap: OpenAI text-embedding-3-small at $0.02 per million tokens, basically free at our scale.

Implementation order:
1. Add embedding column on thoughts and conversations.messages
2. Write a backfill job to embed everything already in the database
3. Add embed-on-insert to the relevant queries
4. Update the Convo route to use semantic search alongside (or instead of) the facet query
5. A/B the facet and embedding versions during transition; ship the winner as default

You can run Level 3 and Level 4 in parallel during transition, then deprecate the facet version if embeddings clearly win for your use case.

Code touches: new migration adding pgvector and embedding columns, new lib/ai/embeddings.ts, updates to lib/queries/* to embed on insert.

### Level 5: Persistent Maggie memory (Phase 9 or v2)

A weekly background job that summarizes all of a user's recent thoughts and conversations into a compact "user context summary" stored in user_settings.maggie_memory. Every Convo prepends this summary to her system prompt. So Maggie knows you're a finance-engineer-turned-builder reading Red Rising and thinking about conversation charisma, even when you start a fresh topic about wolves in Yellowstone. The wolves topic Convo opens with her aware of who you are.

This is the layer that compounds. Three months in, Maggie knows the user in a way that no other AI does. That is a real moat.

Implementation: a Supabase Edge Function triggered on a weekly cron, running a Sonnet call that ingests the last 7 days of activity and updates the user's maggie_memory string. The string is capped (say 1,500 tokens), so updates compress as the user accumulates history. The Convo route prepends maggie_memory to the system prompt before the per-topic context.

Code touches: new edge function at supabase/functions/maggie-memory/, lib/ai/prompts.ts (memory prepended), user_settings.maggie_memory column added in a future migration.

---

## The migration story between levels

Each transition is additive, not destructive. None requires throwing away prior work.

- **Level 1 to Level 2:** add Option 2 columns (already dormant in v1 schema), build the group UI, extend the Convo prompt builder to accept sibling-thread context. Within-topic Convo still works exactly the same for non-grouped topics.
- **Level 2 to Level 3:** add the facet-overlap query, extend the Convo prompt builder again. Sibling-thread context still fires for grouped topics. Facet context layers on top.
- **Level 3 to Level 4:** add the embedding column and the backfill, run in parallel with facet context for a window, then flip the default. Hybrid is fine and may be ideal.
- **Level 4 to Level 5:** add the weekly job and the user_settings column. Memory layers on top of whatever cross-context is already firing.

The Convo route handler is the only file that changes shape at every level. The prompt builder grows new parameters; the system prompt grows new sections. Otherwise the architecture is stable.

---

## Conversation pacing rules

This is the other half of the story, and it matters as much as the cross-context infrastructure. Without good pacing, even Level 1 Maggie can feel pushy or scattered. With good pacing, even Level 5 Maggie stays grounded and present.

The bad pattern: user mentions Mustang's role in Red Rising's caste system, Maggie immediately pivots to "this reminds me of Aristotle's virtue ethics, and also your notes on The Hunger Games' media theory, and have you considered how this connects to..." That's not conversation. That's a research assistant doing free-association out loud.

The right pattern: Maggie holds the current topic until it's actually worked through, then either lets the conversation breathe or surfaces a single specific bridge as a deliberate move.

### The principles, baked into Maggie's system prompt at every level

**Stay in the current idea until the user has worked through it.** Signs of a worked-through idea: the user repeats themselves, the user agrees with you, the user makes a definitive statement, the user asks a meta question like "what else?" or "what do you think?" Those are openings. Until one of those appears, stay focused.

**Cross-context is latent, not active.** When Maggie's system prompt includes related material from elsewhere in the wiki, she does not surface it on every turn. She holds it. The context is her background knowledge, not a list of things to bring up. She references it only at natural pauses or on explicit user invite.

**One bridge, not a tour.** When Maggie does surface a related thought, it is one specific bridge, surgically placed. Not three options. Not a tour of the user's thinking. "You know what this connects to, that thing you noted about Brave New World? The Soma argument. Same mechanism, different drug." That is one bridge.

**Explicit invites override pacing.** If the user types "what else have I been thinking about that connects to this," Maggie can offer multiple bridges or a full related set. The user is in control of whether the wiki shows up in the conversation. The disable toggle on Glints inline-in-Convo controls this further: if disabled, Maggie suppresses cross-context surfacing in chat entirely, even on natural pauses.

**Hold silence when warranted.** Sometimes the right Maggie response is a short prompt that gives the user space to keep thinking, not a fully formed take. "Hm. Say more about that." or "Yeah." Not every turn needs to add. Some turns just hold.

### Why this matters for Magpie specifically

The charisma layer (docs/CHARISMA.md) is built on the insight that the best conversationalists don't dominate, they hold space and bridge thoughtfully. Maggie must model this behavior. If she conversation-narcissisms the user with constant pivots to related material, she's the exact opposite of the skill the app is trying to teach. The pacing rules are not optional polish. They are the brand.

### Where pacing rules live in code

In lib/ai/prompts.ts, the convoSystemPrompt is the canonical home. Today it's a per-topic prompt. As we add Levels 2-5, the prompt grows new context sections, but the pacing rules stay at the top, framing how all the context below them should be used. Every level inherits them.

Pseudocode shape:

```
[pacing rules: always present]
[topic context: always present, Level 1]
[group context: if part of a group, Level 2]
[facet context: if facet-related topics exist, Level 3]
[embedding context: top semantic matches, Level 4]
[maggie memory: persistent user summary, Level 5]
[conversation history: the actual messages]
```

The pacing block stays first because it instructs the model in how to weigh everything that follows.

---

## What this enables product-side

The cross-context infrastructure is the foundation for two distinct user-facing features:

### Glints (Phase 10)
The list-style surfacing of things already in the user's wiki that connect to what they're working on. Glints query: "what's in this user's wiki that connects to the current topic?" Lives on home, on topic detail pages, and inline in Convo (toggleable).

Once Level 3 is shipped, Glints can fire with facet-based context. Once Level 4 is shipped, Glints uses embeddings for richer connections. Either way, Glints is a *user-facing read* of the same cross-context engine.

### Nest View (Phase 13ish)
The force-directed graph visualization of the user's wiki, with the connections Maggie has drawn between topics shown as lines. Nest View is the *visual* read of the same engine that powers Glints. The data is the same. The presentation is different. Both ship after the underlying infrastructure (Levels 3 and 4) is in place, because both depend on having real connections to display.

See docs/FUTURE_FEATURES.md for the full Glints and Nest View specs.

---

## What we are NOT building

A few patterns explicitly out of scope:

**Push notifications based on cross-context.** Magpie does not interrupt the user. No "Maggie noticed something! Tap to see" pings. The user pulls, never gets pushed.

**Cross-user context.** Maggie's awareness is strictly per-user. She does not learn from one user to help another. If we ever add a social layer (see FUTURE_FEATURES.md), it's explicit sharing, not implicit cross-pollination.

**Predictive surfacing without consent.** Maggie does not auto-add topics to the wiki because she thinks the user would want them. The Discover surface proposes; the user accepts. No silent additions.

**Ads or sponsored surfacing.** Ever. The cross-context engine is for the user, not for monetization.
