/**
 * Challenge mode bakes.
 * Pre-written hot takes / steelmen / paradoxes that fake the Challenge AI mode
 * for the prototype demo. Replace with real Sonnet calls when Challenge is
 * promoted to Tier 1 (real AI). See lib/seed/bakes/README.md for shape rules.
 */

export type ChallengeBake = {
  topicSlug: string;
  challenge: string;
  reroll?: string; // optional alternate take if the user hits Reroll
};

export const CHALLENGE_BAKES: ChallengeBake[] = [
  // ============================================================
  // RED RISING (the live-demo topic, written in full)
  // ============================================================
  {
    topicSlug: 'red-rising-the-color-caste-as-social-commentary',
    challenge:
      "the color caste reads as obvious commentary on race, but the more interesting argument is that it is commentary on credentialism. every gold went to the same schools, ate the same food, was bred for the same outcomes. the violence of the system is not that reds were oppressed by golds. it is that golds were manufactured to believe they earned it. that hits closer to home than most readers want to admit.",
    reroll:
      "everyone reads red rising as a critique of hierarchy. it might be a defense of mobility. darrow does not destroy the caste, he climbs it. the book asks whether the system can be reformed from inside, and the answer it gives is mostly yes. that is a more conservative argument than the marketing suggests.",
  },

  // ============================================================
  // STUB: add more bakes for demo-likely topics below.
  // Recommended priority order:
  // 1. The other Red Rising thread topics
  // 2. Topics from Books, Movies, TV Shows that judges might tap
  // 3. The most-clicked Discover items
  // ============================================================

  // Example stub (delete or fill):
  // {
  //   topicSlug: 'why-every-empire-thinks-it-is-the-last-one',
  //   challenge: '...',
  // },
];

/**
 * Look up a Challenge bake by topic slug. Returns null if no bake exists,
 * in which case the Challenge route handler should fall back to a generic
 * placeholder ("Maggie is brewing a hot take") so the UI never feels broken.
 */
export function getChallengeBake(topicSlug: string): ChallengeBake | null {
  return CHALLENGE_BAKES.find((b) => b.topicSlug === topicSlug) ?? null;
}
