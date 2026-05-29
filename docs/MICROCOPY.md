# Magpie · Microcopy

The feature-level taglines that sit under feature names on cards, headers, and section labels. Locked. Do not invent new feature taglines. If a surface needs one, pick from this table.

These lines are different from the brand taglines in `MESSAGING.md`. Brand taglines speak about the product as a whole. Microcopy speaks about the parts.

---

## The table

| Feature | Tagline | Where it lives |
|---|---|---|
| Subjects | *the buckets you care about* | Subject grid header on home |
| Topics | *a conversation worth having* | Topic detail header |
| Facets | *where the connections live* | Facets tab, facet page header |
| Maggie mode | *what's on your mind?* | Capture screen placeholder + tab |
| Brief | *the primer you needed earlier* | Brief tab subtitle |
| Challenge | *the pushback you didn't see coming* | Challenge tab subtitle |
| Questions | *doors, not dead-ends* | Questions tab subtitle |
| Convo | *talk it through* | Convo tab subtitle |
| Glints | *worth a look this week* | Glints home section, topic page glints card |
| Discover | *things Maggie thinks you'd dig* | Discover tab subtitle |
| Draw Out | *practice making someone brilliant* | Draw Out tile, Draw Out session header |
| Nest View | *your curiosity, mapped* | Nest View entry, full-screen header |
| Convo Roulette | *let chance pick the topic* | Roulette card on home |
| Journal | *your thinking, by date* | Journal tab subtitle |
| Add Topic | *catch it before it's gone* | Add Topic modal header |

---

## Voice rules

These follow the same rules as the brand voice in `BRAND.md`:
- Lowercase, italic Fraunces in the UI
- Brief: 3 to 6 words ideal
- Concrete over abstract
- Never marketing-shaped ("Discover insights!" "Unlock potential!")
- Never feature-shaped ("AI-powered question generator")
- A claim or a posture, not a description

---

## Why these phrasings

A few that earned their slot through specific reasoning:

**Topics: "a conversation worth having."** Originally drafted as "a conversation you'd want to have." The shorter version makes a sharper claim. Topics are not just things you would talk about, they are things that deserve the conversation.

**Questions: "doors, not dead-ends."** The Questions mode is the MVP charisma feature. This tagline captures the open-vs-closed distinction from `CHARISMA.md` in four words. Also works as the explanation if someone asks what "good questions" means in Magpie.

**Draw Out: "practice making someone brilliant."** One step broader than "making others feel interesting." The Diane preview is honest about what is being practiced: the act of pulling brilliance out of another person, not just performing charm.

**Add Topic: "catch it before it's gone."** Reinforces the magpie metaphor. The shiny thing flies away if you do not grab it. This is the line that justifies fast capture as a feature.

**Glints: "worth a look this week."** Already locked in the homepage. Quiet, possessive, not pushy. Glints offers, never insists.

**Discover: "things Maggie thinks you'd dig."** Outward-facing copy. Note the voice difference from Glints: Glints points at past user activity ("you wrote about this when"), Discover points at Maggie's noticing ("Maggie thinks"). The voice distinction reinforces the product distinction. See `BRAND.md` Glints vs Discover section.

**Nest View: "your curiosity, mapped."** Possessive ("your") plus a concrete claim ("mapped"). Avoids "graph," "constellation," "network" because those are the implementation, not the experience. What the user gets is a map of their own curiosity.

---

## Microcopy that is NOT a tagline

These are different and live in code, not in this doc:
- Button labels (Add, Skip, Save, Spin Again)
- Empty states ("Nothing here yet. Tap + to start.")
- Error messages
- Loading states
- Maggie's chat dialogue (follows `BRAND.md` voice rules + `MEMORY.md` pacing rules)

If you need to write any of those, write them fresh per surface. Do not reuse taglines as button labels.

---

## When a feature ships without a tagline yet

Some features are stub-only in the prototype (e.g., the desktop two-pane Subject view, the cross-context Convo for groups). If a stub needs a label before the official tagline is locked, use the feature name only with no italic subtitle. Never invent a placeholder tagline. The empty whitespace under the feature name is fine and honest.

When the feature ships for real, add its tagline to this table and update its locations across the app.
