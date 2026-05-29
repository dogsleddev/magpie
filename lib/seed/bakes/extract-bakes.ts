/**
 * Extract bakes.
 * Pre-written AI-assist Add Topic extractions, keyword-matched against what
 * the user types into the textarea. After a 1.5s "Maggie's reading..." loader,
 * return the closest match. If no keyword matches, fall back to a generic
 * "Maggie pulled these threads" extraction.
 *
 * Replace with the real Extract prompt + Sonnet call when promoted to Tier 1.
 */

export type ExtractBake = {
  keywords: string[]; // any of these substrings (case-insensitive) trigger this bake
  proposals: {
    title: string;
    subject: string;
    facets: string[];
  }[];
};

export const EXTRACT_BAKES: ExtractBake[] = [
  {
    keywords: ['music', 'song', 'album', 'metal', 'classical', 'jazz'],
    proposals: [
      { title: 'Why metal subgenres splinter every four years', subject: 'Music', facets: ['trends', 'evolution'] },
      { title: 'Is EDM the new classical?', subject: 'Music', facets: ['philosophy', 'evolution'] },
      { title: 'Why every breakup album rips off the same chord progression', subject: 'Music', facets: ['fun facts', 'convergent'] },
    ],
  },
  {
    keywords: ['history', 'empire', 'rome', 'medieval', 'ancient'],
    proposals: [
      { title: 'Why every empire thinks it is the last one', subject: 'History', facets: ['paradox', 'history'] },
      { title: 'Why medieval peasants worked fewer hours than we do', subject: 'History', facets: ['counterintuitive', 'history'] },
      { title: 'Pirates ran the most democratic societies of the 1700s', subject: 'History', facets: ['paradox', 'counterintuitive'] },
    ],
  },
  {
    keywords: ['ai', 'llm', 'gpt', 'claude', 'model', 'agent'],
    proposals: [
      { title: 'LLMs can rhyme but cannot count letters, and why', subject: 'AI & Tech', facets: ['paradox', 'counterintuitive'] },
      { title: 'Agent swarms and the org chart of 2030', subject: 'AI & Tech', facets: ['future', 'trends'] },
      { title: 'Who owns the output when a model writes your contract', subject: 'AI & Tech', facets: ['ethics', 'future'] },
    ],
  },

  // ============================================================
  // STUB: add more keyword sets during the build. The pattern is:
  // detect a thematic word, propose 2-3 specific topics from the
  // closest subject in the seed pack.
  // ============================================================
];

/**
 * Match the input text to a bake by keyword. Returns the first match,
 * or a generic fallback if no keyword matches.
 */
export function getExtractBake(input: string): ExtractBake['proposals'] {
  const lower = input.toLowerCase();
  for (const bake of EXTRACT_BAKES) {
    if (bake.keywords.some((k) => lower.includes(k))) {
      return bake.proposals;
    }
  }
  // Generic fallback
  return [
    { title: 'A thought worth coming back to', subject: 'Discoveries', facets: ['fun facts'] },
    { title: 'Something to riff on later', subject: 'Discoveries', facets: ['thought experiment'] },
  ];
}
