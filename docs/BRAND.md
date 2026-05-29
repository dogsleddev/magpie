# Magpie · Brand

## Identity

- **Name:** Magpie
- **Domain:** magpie.wiki
- **Brand line (soul):** Collect curiosities. Talk them through.
- **Landing hero (seller):** Get better at the conversations that matter.
- **Memorable second beat:** Be the most interesting person in the room by making everyone else feel like one.
- **Secondary (bios, about):** Bring out the best in every conversation.

Full hierarchy and the "one line per surface" rule live in `MESSAGING.md`. That doc is the source of truth for which line goes where. Do not invent new taglines.
- **Persona:** Maggie (renameable)
- **Mark:** A simple flat magpie silhouette with a single iridescent dot (the "shiny thing" the magpie just spotted)

## Core metaphor

A magpie is famous for two things: collecting shiny objects and chattering constantly. Both behaviors map to this product:

- The grid is the nest where shiny things (topics) are kept
- Maggie chatters about whatever shiny thing you both pick up
- "Magpie mind" is an actual English idiom for an eclectic, curious thinker. We are leaning all the way into that.

## Plumage palette

The magpie has black plumage that catches iridescent blues, greens, and purples in the right light. That's our palette.

```
--bg #0A0A09 /* near-black, the magpie's body */
--bg-card #161513 /* very subtle lift */
--bg-card-2 #1F1D1A /* hover lift */
--bg-input #100F0D /* inputs sit slightly recessed */
--border #2A2925 /* subtle separation */
--border-strong #3A3833 /* prominent borders */

--text #F5F4EF /* off-white, the magpie's belly */
--text-muted #A5A39A /* secondary copy */
--text-dim #76746C /* tertiary, metadata */

--teal #1D9E75 /* primary accent, iridescent green */
--teal-soft #0F6E56 /* deeper teal, backgrounds */
--blue #378ADD /* secondary accent */
--blue-soft #185FA5 /* deeper blue */
--purple #7F77DD /* tertiary accent */
--purple-soft #534AB7 /* deeper purple */

--danger #E24B4A /* destructive actions */
--warn #EF9F27 /* timer wrap-up state */
```

The three accents (teal, blue, purple) together form the iridescent shimmer. Use them sparingly and intentionally:

- **Teal:** primary actions, active states, the "shiny dot" on the wordmark, captured-thought bullets, organize results header
- **Blue:** secondary actions, back buttons, links
- **Purple:** organize button, AI-flavored surfaces, welcome hints

Together (in a horizontal gradient sweep) they show up in the Convo Roulette button hover state as a subtle iridescent shimmer.

## Typography

- **Display:** Fraunces (Google Fonts) for the wordmark, topic titles, modal titles, key italic moments. Use weight 500 by default; 400 italic for taglines and accent.
- **Body:** DM Sans (Google Fonts) for everything else. Weights 400, 500, 600.

Imports:
```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

CSS:
```css
--font-display: 'Fraunces', 'Georgia', serif;
--font-body: 'DM Sans', system-ui, -apple-system, sans-serif;
```

Fraunces brings warmth and editorial character to a UI that would otherwise feel like a clinical productivity app. DM Sans keeps the body readable and modern without leaning generic.

**Never use:** Inter, Roboto, system-ui by default, Arial. These are AI-default fonts. Magpie has more taste than that.

## Voice & tone

### Magpie's voice (UI copy)

Editorial, warm, slightly knowing. Short sentences. Concrete. Occasional Fraunces-italic accent line for emphasis. Never marketing-speak.

Examples:
- ✅ "Collect curiosities. Talk them through."
- ✅ "Catch thoughts as they come, edit later."
- ✅ "If this hits, you'd dig"
- ❌ "Unlock your conversational potential!"
- ❌ "Discover amazing AI-powered insights"
- ❌ "Take your conversations to the next level!"

### Maggie's voice (in-chat persona)

Lowercase by default. Brief (1 to 3 sentences usually). Casual, like a smart friend at a party. Has her own takes, not just questions back. Occasionally suggests adjacent topics. Never opens with "Great question!" or "That's interesting!" or any AI-shaped pleasantry.

Examples:
- ✅ "hey, what's pulling you on this one?"
- ✅ "honestly the most interesting bit is how the Romans used the same trick twice"
- ✅ "have you looked at the corollary in early Mesopotamia? wild stuff"
- ❌ "That's a fascinating question! Let me think about that..."
- ❌ "There are several key things to consider here:"
- ❌ "I'd be happy to help you explore this topic!"

If a system prompt change is ever needed for Maggie, the source of truth is `lib/ai/prompts.ts` → `convoSystemPrompt()`.

### Glints vs Discover copy patterns

These two surfaces serve different jobs (see `docs/FUTURE_FEATURES.md` for the full distinction). Their copy must stay distinct or users will conflate them.

**Glints** is inward. The user is being reminded of their own past activity. Copy points at *what the user has done*.

- ✅ "you wrote about this when..."
- ✅ "from your dystopia thread last week"
- ✅ "you riffed on this on Tuesday"
- ✅ "extends your magpie cognition thoughts"
- ❌ "Maggie thinks you'd love this"
- ❌ "Recommended for you"

**Discover** is outward. Maggie is proposing something new to add. Copy points at *what Maggie has noticed*.

- ✅ "Maggie thinks this might catch your eye"
- ✅ "paired with your Breaking Bad thoughts"
- ✅ "connects to your Stoicism topic"
- ❌ "you wrote about this..." (that is Glints territory)
- ❌ "More like this" (feed-shaped, not Maggie-shaped)

The action verbs differ too: Glints rows are tappable, no buttons. Discover cards have Add and Skip buttons. The verb difference reinforces the voice distinction.

## Logo / mark

The mark is a long-tailed magpie, perched on a thin branch in side profile, head turned slightly up. A small iridescent teal dot floats just off her beak: the shiny thing she just spotted. The bird is one solid off-white silhouette on the near-black ground. No outline, no shading, no gradient. The teal dot is the only color note.

This pose carries the brand: she is mid-chatter, attentive, curious, already focused on the next interesting thing.

**Assets in this repo:**
- `public/brand/magpie-mark.png`: full mark (416 x 349), use in headers and brand surfaces
- `public/brand/magpie-mark-small.png`: same mark sized down for lockups
- `public/brand/icon-512.png`: square app icon
- `public/brand/icon-192.png`: square app icon
- `public/brand/favicon-32.png` and `public/favicon.png`: favicon
- `docs/brand-page.html`: a working brand showcase HTML, opens in any browser, useful as a portfolio reference

**Vectorize before launch.** The current marks are PNGs (generated reference). Before production, run the mark through an image tracer (Figma plugin, Illustrator Image Trace, vectorizer.ai) and replace the PNGs with a clean SVG. Once vector, the dot color comes from `var(--teal)` and the body from `var(--text)` so theming is automatic.

**Behavior:** on hover or active state, the teal dot can subtly pulse or glow. Subtle, not a strobe.

**Inverted use:** for light-mode surfaces, invert the bird to off-black on off-white. The teal dot stays teal (it works on both).

## Do's and don'ts

### Do
- Use the plumage palette as written, with one accent dominant at a time
- Use Fraunces italic for emphasis moments (it's the equivalent of a vocal lilt)
- Let dark mode breathe: generous spacing, especially around the wordmark
- Use the iridescent shimmer sparingly (Convo Roulette button hover, occasional brand moment)
- Write in second person ("your topics", "your thoughts")

### Don't
- Don't use em dashes. Not in copy, not in code comments. Use periods, commas, parentheses, or colons.
- Don't use generic AI illustrations (purple-blue gradients on white, abstract circuit boards, neural network meshes). Magpie is editorial, not techy.
- Don't put more than ONE high-emphasis accent color on screen at once. The shimmer is a moment, not a baseline.
- Don't use emojis in default copy. Maggie can use them in chat occasionally if the conversation goes there, but UI copy stays clean.
- Don't write copy that sounds like a feature ad. Magpie speaks like a thoughtful tool, not a product launch deck.
- Don't capitalize the persona's voice (lowercase is part of her character)

## Inspirational reference points (mood, not copying)

- **Things by Cultured Code**: the calm, refined dark mode and the editorial spacing
- **Readwise / Reader**: the way captured content compounds and surfaces
- **Are.na**: the "personal collection of curiosities" energy
- **The New Yorker website**: Fraunces-adjacent editorial typography
- **Linear**: the precision of dark UI without being clinical
