/**
 * Related topics bakes.
 * Pre-written "If this hits, you'd dig" suggestions for the section at the
 * bottom of each topic detail page. Replace with real Haiku calls when promoted.
 * See lib/seed/bakes/README.md for shape rules.
 */

export type RelatedBake = {
  topicSlug: string;
  related: {
    title: string;
    subjectHint: string;
    whyLine: string; // one line of "why this connects"
  }[];
};

export const RELATED_BAKES: RelatedBake[] = [
  // ============================================================
  // RED RISING (the live-demo topic)
  // ============================================================
  {
    topicSlug: 'red-rising-the-color-caste-as-social-commentary',
    related: [
      {
        title: 'Brave New World was the more accurate prediction',
        subjectHint: 'Books',
        whyLine: "same mechanism, different drug: dystopias work best when chosen",
      },
      {
        title: "GATTACA's quiet horror is that the dystopia mostly works",
        subjectHint: 'Movies',
        whyLine: "another color-caste, this one written in the genome",
      },
      {
        title: "Why Confucius and Aristotle independently arrived at virtue ethics",
        subjectHint: 'Philosophy',
        whyLine: "what counts as a good gold is what counts as a good person",
      },
    ],
  },

  // ============================================================
  // STUB: add more bakes during the build. Generic fallback shows
  // 3 randomly chosen topics from the user's wiki tagged with a
  // shared facet, if any exist.
  // ============================================================
];

/**
 * Look up Related bakes by topic slug. Returns null if no bake exists.
 */
export function getRelatedBake(topicSlug: string): RelatedBake | null {
  return RELATED_BAKES.find((b) => b.topicSlug === topicSlug) ?? null;
}
