# Bakes

This folder contains pre-written content for Tier 2 ("mocked but polished") features in the 10-hour prototype. These files exist so the prototype can demo features that appear to use AI but are actually pulling from hand-written content keyed by topic or pattern.

Each file ships with one or two example entries to make the shape clear. During the prototype build, expand the entries for the 5-10 most demo-likely topics. After the prototype, when the corresponding feature gets promoted to Tier 1 (real AI calls), the bakes files get deleted.

## Files

- `challenge-bakes.ts`: pre-written Challenge mode takes, keyed by topic title slug
- `organize-bakes.ts`: pre-written Organize results (Insights, Counters, Follow-ups, Learn More) keyed by topic title slug
- `related-bakes.ts`: pre-written Related topic suggestions, keyed by topic title slug
- `discover-bakes.ts`: pre-written Discover queue items (a flat list, no key)
- `extract-bakes.ts`: pre-written AI-assist Add Topic extractions, keyed by detected keyword
- `drawout-script.ts`: pre-written character chat for the Draw Out preview (Diane, the air traffic controller)

## Shape

Each bakes file exports a typed const. Routes that would call AI in Tier 1 instead import the bakes and look up the matching entry. If no match exists, they fall back to a generic-but-believable placeholder so the UI never feels broken.

## When promoting a feature to Tier 1

1. Replace the bake lookup with the real AI call (Haiku for Brief/Organize/Related, Sonnet for Challenge, see lib/ai/prompts.ts for the prompts)
2. Add the ai_cache lookup pattern around the call so results persist
3. Delete the corresponding bakes file
4. Update the import in the relevant route handler

## Voice consistency

All bakes copy must follow the brand voice rules in docs/BRAND.md:
- Lowercase Maggie in chat
- No em dashes anywhere
- Editorial, never marketing
- Concrete over abstract
- Maggie's tone: warm, brisk, lightly curious, never sycophantic
