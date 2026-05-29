/**
 * Organize mode bakes.
 * Pre-written structured Organize results (Insights, Counters, Follow-ups,
 * Learn More) that fake the Organize button output for the prototype demo.
 * Replace with real Sonnet calls when promoted to Tier 1.
 * See lib/seed/bakes/README.md for shape rules.
 */

export type OrganizeBake = {
  topicSlug: string;
  insights: string[];
  counters: string[];
  followUps: string[];
  learnMore: { title: string; subjectHint?: string }[];
};

export const ORGANIZE_BAKES: OrganizeBake[] = [
  // ============================================================
  // RED RISING (the live-demo topic, written in full)
  // ============================================================
  {
    topicSlug: 'red-rising-the-color-caste-as-social-commentary',
    insights: [
      "the most stable dystopias are the ones the population helps maintain. red rising's reds chant the gold creed at festivals. they are not just oppressed, they are participating.",
      "darrow's transformation from red to gold is also a transformation in how he reads the system. the caste is not most powerful when it crushes him, it is most powerful when he learns to think like a gold.",
      "the color visual metaphor does a lot of work that race-based dystopias usually try to ignore. it makes the caste visible at a glance, which means every interaction is a reminder.",
    ],
    counters: [
      "the color system might be too neat. real caste systems are messy, contested, full of edge cases. brown does not just hand the world over because they were told to.",
      "the rebellion succeeds because of one exceptional individual. that is a thin theory of how change actually happens.",
    ],
    followUps: [
      "how does the caste handle people who do not fit one color cleanly? are there mixed-color characters?",
      "what is the gold's actual quality of life? are they happier than the reds, or just better-fed prisoners?",
      "if the system collapsed tomorrow, which color would lead what comes next?",
    ],
    learnMore: [
      { title: "Hunger Games is a YA novel hiding a coherent theory of media", subjectHint: 'Books' },
      { title: "Brave New World was the more accurate prediction", subjectHint: 'Books' },
      { title: "GATTACA's quiet horror is that the dystopia mostly works", subjectHint: 'Movies' },
    ],
  },

  // ============================================================
  // STUB: add more bakes for demo-likely topics below.
  // Generic fallback can be: { insights: ['Maggie is still pulling threads on this one'], counters: [], followUps: [], learnMore: [] }
  // ============================================================
];

/**
 * Look up an Organize bake by topic slug. Returns null if no bake exists.
 */
export function getOrganizeBake(topicSlug: string): OrganizeBake | null {
  return ORGANIZE_BAKES.find((b) => b.topicSlug === topicSlug) ?? null;
}
