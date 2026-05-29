/**
 * Magpie starter pack.
 * Seeded for new users on first sign-in, unless they opt for personalized onboarding.
 * Curated to show off the cross-subject facet patterns.
 *
 * Volume: 13 subjects, 18 facets, ~115 topics.
 * Cross-cutting facets to demo: paradox, counterintuitive, convergent, ethics, dystopia.
 * Tapping any of those five lights up topics across 5+ subjects.
 *
 * LIVE-DEMO ANCHOR: "Red Rising" is implemented as a facet for v1 (Option 3 simulation)
 * so the demo can show a Red Rising sub-wiki of topic threads, mimicking what Phase 4.5
 * (Option 2 topic groups) will deliver post-hackathon. Topics tagged with the `red rising`
 * facet are marked with a comment indicating they become group children under Option 2.
 * See docs/MEMORY.md for the four-level cross-context model.
 */

export type SeedFacet = string;

export type SeedTopic = {
  title: string;
  facets: SeedFacet[];
};

export type SeedSubject = {
  name: string;
  topics: SeedTopic[];
};

export const STARTER_PACK: SeedSubject[] = [
  {
    name: 'History',
    topics: [
      { title: 'Why every empire thinks it is the last one', facets: ['paradox', 'history'] },
      { title: 'The Library of Alexandria probably burned down four separate times', facets: ['history', 'fun facts', 'forgotten'] },
      { title: "The Bronze Age Collapse as history's first systems failure", facets: ['history', 'paradox'] },
      { title: 'Greek philosophers and their wildly different agorae', facets: ['philosophy', 'history'] },
      { title: 'Why medieval peasants worked fewer hours than we do', facets: ['paradox', 'history', 'counterintuitive'] },
      { title: 'The plague made Europe rich', facets: ['paradox', 'history', 'counterintuitive'] },
      { title: 'Genghis Khan killed enough people to measurably cool the planet', facets: ['history', 'extremes', 'fun facts'] },
      { title: 'Pirates ran the most democratic societies of the 1700s', facets: ['paradox', 'history', 'counterintuitive'] },
      { title: 'The Industrial Revolution was bottlenecked by typeface, not steam', facets: ['history', 'paradox', 'discoveries'] },
    ],
  },
  {
    name: 'Books',
    topics: [
      // RED RISING ENTITY: in v1 we use the `red rising` facet to simulate Option 2 grouping.
      // In Phase 4.5, these become children of a single "Red Rising" group topic.
      { title: 'Red Rising: the color caste as social commentary', facets: ['red rising', 'philosophy', 'ethics', 'dystopia'] }, // future child of Red Rising group
      { title: 'Red Rising: how the Society actually governs', facets: ['red rising', 'thought experiment', 'dystopia'] }, // future child of Red Rising group
      { title: 'Red Rising: the Howler initiation as the moral pivot', facets: ['red rising', 'ethics', 'thought experiment'] }, // future child of Red Rising group

      // Wider dystopia constellation
      { title: 'How every dystopia rhymes: a study across Red Rising, 1984, Brave New World, Hunger Games, Divergent', facets: ['philosophy', 'convergent', 'dystopia', 'thought experiment'] },
      { title: "Why 1984's surveillance state predicted the wrong dystopia", facets: ['philosophy', 'counterintuitive', 'ethics', 'dystopia'] },
      { title: 'Brave New World was the more accurate prediction and we keep ignoring it', facets: ['philosophy', 'ethics', 'counterintuitive', 'paradox', 'dystopia'] },
      { title: 'Hunger Games is a YA novel hiding a coherent theory of media', facets: ['philosophy', 'ethics', 'counterintuitive', 'dystopia'] },
      { title: "Why Divergent's factions collapse under five minutes of thought", facets: ['paradox', 'counterintuitive', 'dystopia'] },

      // Broader Books
      { title: 'AI consciousness as imagined by Asimov vs Ted Chiang', facets: ['philosophy', 'future', 'ethics'] },
      { title: 'Dune on prescience as a curse, not a gift', facets: ['philosophy', 'thought experiment'] },
      { title: 'Foundation predicted behavioral econ by sixty years', facets: ['fun facts', 'future'] },
      { title: 'Why most sci-fi villains are bad economists', facets: ['thought experiment', 'fun facts'] },
      { title: 'Borges predicted the internet in 1941', facets: ['fun facts', 'future', 'philosophy'] },
      { title: 'The Library of Babel as a metaphor for LLMs', facets: ['thought experiment', 'philosophy', 'future'] },
      { title: 'Cormac McCarthy never used quotation marks and it changed dialogue forever', facets: ['evolution', 'fun facts'] },
      { title: 'Why most great novels were rejected at least seven times', facets: ['paradox', 'fun facts', 'history'] },
      { title: "A Song of Ice and Fire's politics are sharper on the page than on screen", facets: ['philosophy', 'thought experiment', 'convergent'] },
    ],
  },
  {
    name: 'AI & Tech',
    topics: [
      { title: 'Can a model have intuition, or just very fast pattern matching?', facets: ['philosophy', 'thought experiment'] },
      { title: 'Agent swarms and the org chart of 2030', facets: ['future', 'trends'] },
      { title: 'LLMs can rhyme but cannot count letters, and why', facets: ['fun facts', 'paradox', 'counterintuitive'] },
      { title: 'The smarter the model, the harder it is to evaluate', facets: ['paradox', 'challenges'] },
      { title: 'Why prompt engineering will be a dead skill in eighteen months', facets: ['trends', 'future'] },
      { title: 'Models are getting smarter faster than we are getting smarter at testing them', facets: ['paradox', 'challenges', 'future', 'ethics'] },
      { title: 'The most impressive AI products of 2026 will be the ones that hide AI from the user', facets: ['trends', 'paradox', 'future', 'counterintuitive'] },
      { title: 'Claude, GPT, and Gemini are converging on the same answers, and that should worry us', facets: ['paradox', 'future', 'challenges', 'convergent'] },
      { title: 'Who owns the output when a model writes your contract', facets: ['ethics', 'future', 'challenges'] },
    ],
  },
  {
    name: 'Movies',
    topics: [
      { title: 'The Godfather is a movie about email, decades before email', facets: ['paradox', 'philosophy', 'counterintuitive'] },
      { title: "GATTACA's quiet horror is that the dystopia mostly works", facets: ['philosophy', 'ethics', 'thought experiment', 'future', 'dystopia'] },
      { title: 'Snowpiercer as the cleanest class-system thought experiment in modern film', facets: ['philosophy', 'ethics', 'thought experiment', 'dystopia'] },
      { title: "Why Casablanca's ending could not be made today", facets: ['philosophy', 'history', 'evolution'] },
      { title: 'The Shawshank Redemption was a box-office flop and we forgot', facets: ['fun facts', 'forgotten', 'paradox'] },
      { title: "Fight Club's twist works once and ruins every rewatch", facets: ['paradox', 'counterintuitive', 'philosophy'] },
      { title: 'Snatch is the most rewatchable bad-people-doing-bad-things movie ever made', facets: ['fun facts', 'paradox'] },
      { title: 'No Country for Old Men is what happens when fate replaces villains', facets: ['philosophy', 'thought experiment', 'ethics'] },
      { title: 'Children of Men is a long take pretending to be a movie', facets: ['fun facts', 'discoveries', 'philosophy', 'dystopia'] },
      { title: "Why Heat's diner scene is the only acting class you need", facets: ['fun facts', 'skills', 'forgotten'] },
      { title: 'Blade Runner asks if the test for humanity ever made sense', facets: ['philosophy', 'ethics', 'thought experiment', 'dystopia'] },
      { title: 'The Matrix predicted everything except the bills', facets: ['future', 'paradox', 'counterintuitive', 'dystopia'] },
    ],
  },
  {
    name: 'TV Shows',
    topics: [
      { title: 'The Simpsons stopped predicting the future when reality caught up', facets: ['paradox', 'evolution', 'fun facts'] },
      { title: 'The Expanse is the only sci-fi show that takes physics seriously', facets: ['fun facts', 'discoveries', 'thought experiment'] },
      { title: 'Red Dwarf is the British sitcom hiding a real philosophy of self', facets: ['philosophy', 'thought experiment', 'forgotten'] },
      { title: "Seinfeld's no-hugging-no-learning rule changed every show after it", facets: ['evolution', 'fun facts', 'history'] },
      { title: 'Breaking Bad sells the lie that you can be Walt and still be good', facets: ['philosophy', 'ethics', 'paradox'] },
      { title: 'Game of Thrones ended badly because the books refuse to', facets: ['paradox', 'thought experiment', 'convergent'] },
      { title: 'The Wire is the only show where the city is the protagonist', facets: ['philosophy', 'thought experiment', 'discoveries'] },
      { title: 'Better Call Saul is a slower, better tragedy than the show it spun off from', facets: ['paradox', 'counterintuitive', 'evolution'] },
      { title: 'Severance is a workplace comedy in a horror costume', facets: ['paradox', 'counterintuitive', 'philosophy', 'dystopia'] },
      { title: 'Why Twin Peaks broke television and we keep trying to put it back', facets: ['history', 'evolution', 'forgotten'] },
    ],
  },
  {
    name: 'Music',
    topics: [
      { title: 'Why metal subgenres splinter every four years', facets: ['trends', 'evolution'] },
      { title: 'Is EDM the new classical? The compositional case', facets: ['philosophy', 'evolution'] },
      { title: 'AI-generated music and the death of the demo tape', facets: ['future', 'trends', 'ethics'] },
      { title: 'The Mozart effect: what the science actually says', facets: ['fun facts', 'discoveries', 'counterintuitive'] },
      { title: 'Why every breakup album secretly rips off the same chord progression', facets: ['fun facts', 'evolution', 'convergent'] },
      { title: 'Auto-Tune started as a side experiment by an oil company', facets: ['fun facts', 'discoveries', 'counterintuitive'] },
      { title: 'The death of the bridge in modern pop songs', facets: ['evolution', 'trends'] },
      { title: 'Why no two people hear the same song the same way', facets: ['philosophy', 'thought experiment'] },
    ],
  },
  {
    name: 'Wildlife',
    topics: [
      { title: 'Snow leopards: the cat that never roars', facets: ['fun facts', 'extremes'] },
      { title: 'Magpies pass the mirror self-recognition test', facets: ['fun facts', 'discoveries'] },
      { title: 'Octopuses might experience color through their skin', facets: ['discoveries', 'paradox', 'fun facts', 'counterintuitive', 'ethics'] },
      { title: 'Ravens hold funerals', facets: ['fun facts', 'discoveries'] },
      { title: 'Why wolves changed the path of rivers in Yellowstone', facets: ['evolution', 'discoveries'] },
      { title: 'The mantis shrimp sees colors we cannot even name', facets: ['extremes', 'fun facts'] },
      { title: 'Naked mole rats do not seem to age', facets: ['extremes', 'discoveries', 'future'] },
      { title: 'Why crows give gifts to humans who feed them', facets: ['fun facts', 'discoveries'] },
    ],
  },
  {
    name: 'Astronomy & Physics',
    topics: [
      { title: 'The Fermi paradox revisited', facets: ['paradox', 'thought experiment'] },
      { title: 'Time runs faster on your face than your feet, measurably', facets: ['fun facts', 'paradox', 'counterintuitive'] },
      { title: 'What is the universe expanding into?', facets: ['thought experiment', 'paradox'] },
      { title: "Black holes as the universe's hard drives", facets: ['future', 'thought experiment'] },
      { title: 'The universe might be inside a black hole', facets: ['thought experiment', 'paradox'] },
      { title: 'A day on Venus is longer than its year', facets: ['fun facts', 'paradox', 'counterintuitive'] },
      { title: 'Most of what makes you you came from inside dying stars', facets: ['philosophy', 'fun facts'] },
      { title: 'Why we will never see most of the universe, no matter what we build', facets: ['paradox', 'future'] },
    ],
  },
  {
    name: 'Philosophy',
    topics: [
      { title: 'Aristotle on why happiness is a practice, not a feeling', facets: ['philosophy', 'ethics', 'skills'] },
      { title: 'The Stoics figured out cognitive behavioral therapy two thousand years early', facets: ['philosophy', 'history', 'convergent'] },
      { title: 'Nietzsche is wildly misread as a nihilist, and the truth matters', facets: ['philosophy', 'counterintuitive', 'forgotten'] },
      { title: 'The Trolley Problem stopped being useful the moment a Tesla had to answer it', facets: ['ethics', 'thought experiment', 'future'] },
      { title: "Hume's guillotine: you cannot get a should from an is, and AI does it constantly", facets: ['ethics', 'paradox', 'philosophy'] },
      { title: 'Why Confucius and Aristotle independently arrived at virtue ethics', facets: ['philosophy', 'ethics', 'convergent'] },
      { title: 'The Ship of Theseus, with your iPhone', facets: ['philosophy', 'thought experiment'] },
      { title: 'Wittgenstein on why most philosophy arguments are language problems', facets: ['philosophy', 'counterintuitive'] },
    ],
  },
  {
    name: 'Psychology & Behavior',
    topics: [
      { title: 'Why we ask follow-up questions matters more than what we ask', facets: ['philosophy', 'skills'] },
      { title: 'The peak-end rule: your vacation memory is not the vacation', facets: ['discoveries', 'counterintuitive', 'paradox'] },
      { title: 'Conversational narcissism is invisible to the people doing it', facets: ['philosophy', 'paradox', 'counterintuitive'] },
      { title: 'Why our brains lie about our own past in measurable ways', facets: ['discoveries', 'counterintuitive'] },
      { title: 'The myth of multitasking', facets: ['discoveries', 'counterintuitive'] },
      { title: 'Status games are running every conversation, and we cannot see them', facets: ['philosophy', 'paradox', 'thought experiment'] },
      { title: 'Why we are better at noticing bad news than good news, and what it costs', facets: ['philosophy', 'evolution', 'challenges'] },
      { title: 'The bystander effect is real and the original explanation was wrong', facets: ['discoveries', 'counterintuitive', 'forgotten'] },
    ],
  },
  {
    name: 'Cities & Architecture',
    topics: [
      { title: 'Why every American downtown looks the same now', facets: ['paradox', 'trends', 'convergent'] },
      { title: 'How parking lots are the single biggest design decision in any city', facets: ['paradox', 'counterintuitive', 'forgotten'] },
      { title: 'The forgotten geometry of pre-industrial street layouts', facets: ['history', 'forgotten', 'discoveries'] },
      { title: 'Why Tokyo works and most cities do not', facets: ['paradox', 'discoveries', 'thought experiment'] },
      { title: 'The strange persistence of suburban cul-de-sacs', facets: ['history', 'paradox', 'counterintuitive'] },
    ],
  },
  {
    name: 'Food',
    topics: [
      { title: 'Wine terroir: real science or marketing magic?', facets: ['fun facts', 'paradox'] },
      { title: 'Maillard reaction: the chemistry of why food tastes good', facets: ['discoveries', 'fun facts'] },
      { title: 'Why every cuisine independently invented dumplings', facets: ['history', 'evolution', 'convergent'] },
      { title: 'Why no two cultures invented the same hot sauce', facets: ['paradox', 'history', 'evolution', 'counterintuitive'] },
      { title: 'The reason restaurant butter tastes different is illegal at home', facets: ['fun facts', 'paradox', 'counterintuitive'] },
      { title: 'The slow death of bread because of how wheat was bred for tractors', facets: ['evolution', 'history', 'paradox', 'forgotten'] },
    ],
  },
  {
    name: 'Hobbies',
    topics: [
      { title: 'Carnivorous plants and convergent evolution', facets: ['fun facts', 'evolution', 'convergent'] },
      { title: "Why Zelda's Hyrule maps borrow from medieval cartography", facets: ['history', 'fun facts'] },
      { title: 'Why Lego is the most successful design system ever made', facets: ['fun facts', 'evolution', 'discoveries'] },
      { title: 'Vintage typewriter restoration as a meditation practice', facets: ['philosophy', 'skills', 'forgotten'] },
      { title: 'Why guitar players hit a wall at the same point every time', facets: ['paradox', 'evolution', 'skills', 'convergent'] },
    ],
  },
];

/**
 * Get the unique list of facets across the starter pack.
 * Use this to bulk-create facets before inserting topics.
 *
 * Should return 18 facets:
 * paradox, fun facts, future, evolution, philosophy, history, discoveries,
 * thought experiment, trends, challenges, extremes, skills,
 * counterintuitive, forgotten, convergent, ethics, dystopia, red rising
 *
 * Note: `red rising` is an entity-anchor facet for v1 (Option 3 simulation).
 * In Phase 4.5 (Option 2 topic groups), the topics tagged with this facet
 * become children of a "Red Rising" group topic, and the facet can be removed
 * or kept as a tag depending on whether it still earns its slot.
 */
export function uniqueFacets(): string[] {
  const set = new Set<string>();
  for (const subject of STARTER_PACK) {
    for (const topic of subject.topics) {
      for (const facet of topic.facets) {
        set.add(facet);
      }
    }
  }
  return Array.from(set);
}
