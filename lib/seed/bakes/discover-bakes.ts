/**
 * Discover bakes.
 * Pre-written "Maggie's notes" items for the Discover tab. These are OUTWARD
 * suggestions: things to ADD to the wiki, not revisit. See docs/FUTURE_FEATURES.md
 * for the Discover vs Glints distinction.
 *
 * Voice pattern: "Maggie thinks..." or "from your X thread..."
 * Action verbs on the card: Add / Skip
 *
 * Replace with real Related-prompt + curation logic when promoted to Tier 1.
 */

export type DiscoverBake = {
  title: string;
  whyLine: string; // "from your dystopia thread, last Tuesday"
  suggestedSubject: string;
  suggestedFacets: string[];
};

export const DISCOVER_BAKES: DiscoverBake[] = [
  {
    title: 'The Power by Naomi Alderman as the inverse of Red Rising',
    whyLine: "from your dystopia thread, last week",
    suggestedSubject: 'Books',
    suggestedFacets: ['dystopia', 'philosophy', 'ethics'],
  },
  {
    title: 'Why The Wire is the only show where the city is the protagonist',
    whyLine: "paired with your Breaking Bad thoughts",
    suggestedSubject: 'TV Shows',
    suggestedFacets: ['philosophy', 'thought experiment', 'discoveries'],
  },
  {
    title: 'Marcus Aurelius wrote Meditations as journaling, not philosophy',
    whyLine: "connects to your Stoicism topic",
    suggestedSubject: 'Philosophy',
    suggestedFacets: ['philosophy', 'history', 'counterintuitive'],
  },
  {
    title: 'Crows hold grudges for years and pass them to their kids',
    whyLine: "extends your magpie cognition thread",
    suggestedSubject: 'Wildlife',
    suggestedFacets: ['fun facts', 'discoveries', 'extremes'],
  },

  // ============================================================
  // STUB: more bakes can be added freely. Discover lives in its own
  // tab so length is less constrained than Glints. Aim for 8-12 total
  // for a populated demo.
  // ============================================================
];

/**
 * "Ask Maggie for more" button bakes. When the user taps that button,
 * append 3 items from this list to the visible Discover queue.
 */
export const DISCOVER_MORE_BAKES: DiscoverBake[] = [
  {
    title: 'Why the Stoics never wrote books, only letters and notes',
    whyLine: "Maggie pulled this from how you take notes",
    suggestedSubject: 'Philosophy',
    suggestedFacets: ['philosophy', 'history', 'forgotten'],
  },
  {
    title: 'The Voyager golden record is the most expensive love letter ever made',
    whyLine: "from your astronomy + philosophy crossover",
    suggestedSubject: 'Astronomy & Physics',
    suggestedFacets: ['fun facts', 'philosophy', 'discoveries'],
  },
  {
    title: 'Why Severance is a workplace comedy in horror costume',
    whyLine: "from your TV dystopia pattern",
    suggestedSubject: 'TV Shows',
    suggestedFacets: ['dystopia', 'philosophy', 'paradox'],
  },
];
