# Magpie · LinkedIn launch post

Drafted 2026-06-05 (session 10). The announcement for the Krava x Linq hackathon win plus the magpie.wiki waitlist.

## Status: one thing remaining

1. **The people to tag.** @handles for the Krava contacts, Linq contacts, and the judges. That is the only blocker.

**Everything else is done:**
- `public/brand/og-nest.png` EXISTS on prod (generated session 12, 1200x630 constellation, plumage palette). Link-preview cards now have an image.
- **Screenshots captured live from magpie.wiki (session 12):**
  - **Nest constellation (clean, controls hidden):** full colored cluster view, all subjects labelled. **Lead image for the post.** Also a strong carousel slide 1.
  - **Topic page with Maggie's opener:** "Can a model have intuition, or just very fast pattern matching?" + Maggie: "what made you start wondering about where the line is between those two?" Shows the product actually working. Best as carousel slide 2.
  - **App grid:** subjects list (History 9, Books 20, AI & Tech 18...). Secondary. Skip as a standalone.
  - **Landing page hero:** magpie mark + wordmark + tagline. Good for brand context.

**Recommended format:** upload the **Nest constellation** as the native image (or a 6-10s screen-recording of it drifting - video gets more reach). Carousel: constellation first, topic-with-Maggie second. Put magpie.wiki in the **first comment** (LinkedIn throttles in-body links). The first two lines must hook before the "see more" cut.

## The draft

> A map of what you're genuinely curious about is more revealing than your search history.
>
> It's your half-formed thinking, the questions you haven't said out loud yet. I'd argue it's the last data you'd want sitting on someone's server in the clear.
>
> Last weekend at the Krava x Linq hackathon, I built Magpie around that idea, and it took runner-up.
>
> Magpie is a place to collect the things you find shiny and talk them through with a partner who remembers. The hackathon was about privacy, so that's what I leaned into: I built Magpie's AI to run through Krava's confidential compute, so the model does its thinking inside a hardware enclave instead of on an open server.
>
> I also used Linq to give it an iMessage front door, so a curiosity you text on a walk becomes part of your wiki.
>
> The judge feedback I'm proudest of: "a real product, not an LLM wrapper."
>
> Thank you to [Krava folks] and [Linq folks] for sponsoring, and to [judges] for the time and the sharp questions.
>
> The image above is the community's nest so far, 150+ curiosities and counting. The waitlist is open. Link in the comments. 🪶

**First comment:** `Magpie is at magpie.wiki. Join the waitlist and add your first curiosity.`

**Alternate opening hooks to test:**

- "I'm a finance guy who can't stop collecting curiosities, so I built a home for them."
- "This is 150 curiosities mapped as a constellation. It's a small community thinking out loud."

## Honest-framing rules (privacy)

- Krava is wired **Level-1 only** (AI inference through TEEs, app-key based, no user key). Do NOT claim encrypted storage or identity-decoupling: neither is built. See the `krava-privacy-reality` project memory.
- Frame privacy as the hackathon's theme and what was built ("I built it to run through Krava"), not a production guarantee. Prod Krava routing is unverified; check the Vercel logs before any present-tense claim.

## Reviewer prompt (paste into a chat, then paste the draft under it)

> You are a social media editor who specializes in LinkedIn launch posts for founders. I'll share a draft post and I want sharp, specific feedback. Context first.
>
> What I built: Magpie (magpie.wiki). A personal conversation gym: you collect the things you're curious about into a small wiki, then talk them through out loud for a few minutes with an AI partner named Maggie who remembers what you've said across topics. The signature visual is the "community nest," a force-directed constellation where every dot is a curiosity and every thread is a connection between them. There's a public waitlist.
>
> The occasion: I built it at the Krava x Linq hackathon (Frontier Tower, SF) and took runner-up. Krava is privacy infrastructure for AI (it runs model inference inside hardware enclaves); the hackathon's theme was privacy. Linq is an iMessage layer I used so people can text the app. Judge feedback I liked: "a real product, not an LLM wrapper."
>
> Audience: my LinkedIn network, mostly finance people, founders, and tech. I'm a solo builder under the dogsled.dev brand.
>
> Goal: attention and waitlist signups. A constellation image or short screen-recording is the native visual; the magpie.wiki link goes in the first comment.
>
> Voice and hard rules: honest founder voice, not marketing-speak (no "unlock," "supercharge," "AI-powered," "game-changer"). No em dashes anywhere. Do not overclaim privacy: only the AI inference runs through Krava's enclaves; stored data isn't encrypted and identity isn't decoupled yet, so frame privacy as what I built and explored, not a finished guarantee. The first two lines must hook before LinkedIn's "see more" cut.
>
> Your job: review the draft. What's working, what isn't. Sharpen the hook, tighten the flow, make the CTA land. Flag anything that overclaims or rings false. Give me 2 or 3 alternate opening lines to test. Keep my voice.
>
> Here's the draft: [paste]
