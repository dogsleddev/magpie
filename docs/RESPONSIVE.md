# Magpie · Responsive Design

How Magpie scales across screen sizes. Mobile is the design source of truth. Desktop earns the right to add space, context, and reading rhythm, but never reinvents the product.

This doc is the spec for the three-layout system and the rules that keep both ends of the spectrum feeling intentional.

---

## The discipline

Most mobile-first apps end up with desktop layouts that are literally a phone in the middle of a 4K screen. Centered 375px column, gray sidebars, looks like someone forgot to design the wide layout. That is the failure mode we avoid.

The opposite failure is also real: desktop layouts that try to be too much because they can. Three columns of stuff, dense navigation, info-overwhelm. That is not Magpie. Magpie is editorial, spacious, calm. The desktop layout should feel like a great magazine or a thoughtful tool, not a dashboard.

The discipline: mobile-first sets the *content priorities and interaction model*. Desktop adds breathing room and one extra layer of context where it earns its keep. Same content, same hierarchy, more space.

---

## The three layouts

Three distinct sizes, not "phone vs not-phone."

### Mobile (under 768px)

The design source of truth. Single column, bottom tab bar, app-bar at top, content full-width. Every screen designed to be one-handed at 375px.

This is where 75% of usage lives. Optimize here first, always.

### Tablet (768px to 1280px)

A transition zone. Slightly wider single column with more generous whitespace, OR a light two-pane layout for surfaces where it earns the second pane (Subject view shows topics on the left, hovered/selected topic preview on the right). Bottom tab bar may become a left rail in some places, stays on bottom in others.

Honest answer: most users will not touch this layout much. It should be a graceful in-between, not a third bespoke design.

### Desktop (1280px and up)

The canvas. Centered max-width around 1240px so the layout does not sprawl across an ultrawide monitor. Left rail for navigation replaces the bottom tab bar. Two-pane layouts where they serve the content. Generous typography. Real reading widths for prose.

---

## The "one extra layer of context" rule

The single most important rule. Desktop is allowed to show one extra layer of context that mobile hides behind a tap. Not three layers. One.

Examples:

- Mobile shows the topic. Desktop shows the topic AND the related glints panel on the right.
- Mobile shows the subject list. Desktop shows the subject list AND a preview of the highlighted subject's topics.
- Mobile shows the current Convo. Desktop shows the current Convo AND the topic's mode tabs as a sticky vertical rail.

Adding more than one extra layer turns the desktop into a dashboard. The discipline holds at one.

---

## Desktop-specific patterns

A handful of specific moves that earn the desktop space without breaking the mobile-first identity.

### The left rail

A persistent left navigation column on desktop, replacing the bottom tab bar. The four tabs as vertical items (Grid, Facets, Discover, Journal), plus a + button for Add Topic and a profile menu at the bottom. This is the Linear / Are.na / Things pattern.

The rail is roughly 220-260px wide, with the small magpie mark at the top, the tabs stacked beneath, and the profile menu pinned to the bottom. The rest of the screen is content.

### Two-pane Subject view

On desktop, tapping a subject does not take the user to a new page. The subject's topics expand in a middle column, and tapping a topic opens it in a right column. You can browse a whole subject without losing context. Mobile keeps the drill-down because there is no room for two panes.

Layout: left rail (240px) + subject list (320px) + topic content (flex). On a 1440px screen this gives the topic ~640px of reading width with margins.

### Two-pane Topic view

On desktop, the topic content (mode tabs, bullets, Convo) lives in the center column. A right column shows the meta the user would otherwise have to scroll for: facets, related topics, glints. That right rail is roughly 280-320px and contains soft, non-critical context.

Hover any meta item, get a tooltip. Click any item, navigate. This is the equivalent of the right sidebar on a great Substack post: present but never pushy.

### Convo Roulette as a global affordance

On desktop, Convo Roulette lives in the left rail, always one click away. On mobile it stays on the home grid only because there is no room for it elsewhere. This is an example of desktop earning one extra surface.

### Reading widths matter

This is the single biggest thing that distinguishes editorial-quality desktop from amateur "stretch everything to the viewport."

On a 1440px monitor, prose at full-width is unreadable (120+ characters per line). On desktop, the Brief, Challenge, and Convo content gets constrained to ~640-720px center-aligned within its pane. 60-70 characters per line is the editorial sweet spot.

The CSS move:

```css
.prose-content {
  max-width: 720px;
  margin-inline: auto;
}
```

Applied to the right places, this single move makes desktop feel intentional. Skipping it makes desktop feel sloppy.

### The brand-page treatment lives here too

The brand-page.html in docs shows what desktop Magpie can feel like at its best: deep blacks, generous whitespace, Fraunces accents, content-forward layout. That visual language applies to the marketing landing page AND to the app itself when running on desktop. Same brand, same rhythm.

---

## What stays the same on desktop

Some things should NOT change between mobile and desktop because they ARE the brand.

- The plumage palette. Same hexes, same accent usage.
- Typography. Fraunces for display, DM Sans for body. Same type scale at the high end.
- The five mode tabs inside a topic. Same five, same order, same interaction.
- Maggie's voice in Convo. Same lowercase, brief, no AI pleasantries.
- The magpie mark. Same proportions, just sized larger.
- The capture model. Bullets are still bullets. The "What's on your mind?" placeholder is unchanged.

The desktop layout adds context surfaces around these core elements. It does not reinvent them.

---

## What ships when

### Prototype (the 10-hour build before the hackathon)

The honest tradeoff for 10 hours is **Option 2: Mobile-perfect, desktop-real**, which means:

1. Build mobile-first as planned.
2. On desktop (1280px+), add the left rail to replace the bottom tab bar.
3. Apply reading-width constraints (`max-width: 720px; margin-inline: auto;`) to text-heavy modes (Brief, Challenge, Questions, Convo content).
4. Skip the two-pane Subject and Topic layouts. They wait for v1.1.
5. Use generous side margins on the home grid at desktop widths so the mobile layout is visually framed rather than floating.

Roughly 1-2 hours of focused desktop work in addition to the mobile build. Pays off in every screenshot and every visitor first impression.

### v1.1 (Phase 6 or 7, post-hackathon)

Full two-pane layouts:

- Two-pane Subject view (list + topic preview)
- Two-pane Topic view (content + meta rail)
- Persistent Convo Roulette in the left rail
- Hover affordances on facet chips, related items, glint cards

This is the "desktop graduates" moment. Magpie goes from "great on phones, decent on laptops" to "great on both."

---

## Touch targets and accessibility

Both layouts must respect:

- Minimum 44px touch target on mobile interactive elements
- Bottom tab bar respects `safe-area-inset-bottom` on iOS
- Visible focus states on all keyboard-navigable elements (left rail, mode tabs, buttons)
- Color contrast WCAG AA on both palette modes
- Text resizes gracefully to 200% without layout breaking

These are non-negotiable, mobile and desktop alike.

---

## Testing breakpoints

When building, test at exactly these widths:

- 375px (iPhone SE, the smallest realistic target)
- 414px (iPhone Pro Max)
- 768px (iPad portrait, tablet boundary)
- 1024px (iPad landscape, small laptop)
- 1280px (desktop threshold)
- 1440px (typical desktop)
- 1920px (large desktop, content should still be centered with margins)

The transition between 1024px and 1280px is the trickiest one. The bottom tab bar might still make sense at 1024px while the layout is starting to feel cramped. Decide per-page; consistency across the app matters more than perfection at every pixel.

---

## What "desktop-beautiful" actually means for Magpie

The bar is not "uses the screen well." It's "feels designed, not stretched."

Specifically:
- A new visitor lands on magpie.wiki at 1440px and the first thing they feel is calm
- Reading any AI mode (Brief, Challenge, Convo) feels like reading a thoughtful column, not a wide blog
- Navigation is always one click away, never two
- The brand voice survives the format change: Fraunces still does its work, the magpie mark still appears, Maggie still speaks lowercase

When in doubt, return to the brand-page.html in docs. That's the visual reference for what desktop Magpie should feel like.
