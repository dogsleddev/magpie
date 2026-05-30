# Magpie · Krava × Linq Hackathon Integration

This doc captures how Magpie integrates with **Krava** (privacy infrastructure for AI) and **Linq** (iMessage and SMS layer for AI agents) for the Krava × Linq Hackathon at Frontier Tower SF on Saturday, May 30, 2026.

This is the **technical integration plan**. For the marketing presentation of the same integration, see `docs/homepage-hackathon.html`.

## TL;DR

- **Magpie stays Magpie.** The web app at magpie.wiki is unchanged in shape. We are adding a **new input surface** (iMessage via Linq) and **wrapping the AI layer with privacy infrastructure** (Krava). Nothing about the existing five modes, the wiki structure, or the design system changes.
- **Krava wraps `lib/ai/client.ts`.** Every Anthropic call routes through Krava's SDK so inference runs in Trusted Execution Environments, memory is encrypted client-side, and user identity is decoupled from the requests. One-file architectural change. Every mode (Brief, Challenge, Questions, Convo, Organize, Extract, Related) benefits automatically.
- **Linq becomes a new front door.** Users can text Maggie at a real Linq Blue phone number. Conversations are captured server-side, Maggie does an Organize pass on idle, and a new topic appears in the user's wiki with the captured thoughts pre-populated and the convo preserved as a Convo mode session.

This is not a stripped-down version of Magpie. It is Magpie with a second front door and a privacy upgrade.

---

## Event details

- **Date:** Saturday, May 30, 2026
- **Location:** Frontier Tower, 995 Market Street, San Francisco, FL15 Conference Room
- **Schedule:** 11 AM check-in, 12 PM start, 6:30 PM submissions close, 6:40 PM demos (5 min each)
- **Prizes:**
  - 🏆 $500 Best Krava Project
  - 🛡️ $250 Best Krava + Linq Integration
  - ✨ $250 Best Overall Execution
- **Team size:** 1 to 4 people. Solo allowed.
- **Invite URL:** https://luma.com/krava-linq-hackathon?tk=DZ5qhQ

---

## Sponsors

### Krava (krava.io)

Privacy infrastructure for AI agents. Sits between your app and the model provider. Provides four production-grade primitives:

1. **Private PasskeyID.** WebAuthn-based identity (Face ID, Touch ID). One-way hashed credentials. No username, no email, no password to compromise. Krava is architecturally incapable of exposing who a user is.
2. **Secure Memory.** AES-256-GCM encryption across every piece of user data (memory, chat history, identity). Data is encrypted client-side before it touches a database, using a key only the user holds. Persistent encrypted storage across sessions.
3. **PrivateLLM.** Inference runs inside NVIDIA H100 and H200 Trusted Execution Environments. The GPU operator is architecturally incapable of reading data in memory during processing. SOC 2 Type II certified. Cryptographically verifiable.
4. **Private Inference Router.** Routes every request to the cheapest, fastest, most-private enclave available (Tinfoil, Prem, Phala, NEAR AI, or Krava's own TEE infra), picked per task by latency, cost, and jurisdiction. Commercial fallback (Anthropic, OpenAI, Fireworks) is available when sensitivity allows.

What we use it for: wrapping every Anthropic call in `lib/ai/client.ts`. Both `callClaude()` and `streamClaude()` route through Krava. From the user's perspective, nothing changes. From a privacy standpoint, their actual half-formed thinking is encrypted end-to-end, inference runs in attested TEEs, and Krava never knows who any specific user is.

SDK: `npm install @kravalabs/api-client`. TypeScript. OpenAI-compatible interface. EU, US, SE regions.

Krava's homepage explicitly lists Linq as a Krava-powered example app, which makes our integration the canonical Krava + Linq pairing they want to see in the room.

### Linq (linqapp.com)

The iMessage, RCS, and SMS communication layer for AI agents. Real phone numbers that send blue bubbles. $20M Series A from TQ Ventures (Feb 2026). 50,000+ teams. Powers Poke. SOC 2 Type II.

Native iMessage features supported end-to-end: read receipts, voice notes, tapbacks, screen effects, group chats, rich media, typing indicators. Falls back to RCS, then SMS, based on recipient capability.

Their open-source example app at `linqapp.com/s/use-cases/ai-agent` is a complete Claude-powered iMessage agent with a live demo number (+1-415-870-7772). We are not reinventing this. We are following their patterns.

API: `api.linqapp.com/api/partner/v3`. Auth via Bearer token. Webhook for inbound, REST endpoints for outbound. Webhook signing via HMAC.

What we use it for: an inbound webhook at `app/api/linq/webhook/route.ts` that receives incoming iMessages from our Linq Blue phone number, identifies the user by their saved number, and routes the conversation through Krava-wrapped Maggie. Outgoing responses go back through Linq's send-message API.

---

## The user flow

1. User signs up for Magpie at magpie.wiki, links their phone number in settings.
2. User is walking, no app open. They text Maggie at her Linq Blue number: "yo this thing about empires training their own replacements is wild."
3. Linq fires our webhook with the message and phone number.
4. We look up the user by phone number. We find (or start) an active iMessage-originated conversation.
5. We send the message through Krava-wrapped Claude with Maggie's Convo system prompt.
6. Maggie texts back in her lowercase voice with a take.
7. They riff. The whole conversation is saved server-side (encrypted via Krava's Secure Memory).
8. After idle time (say 30 minutes) or when the user texts "save", we run the Organize prompt: extract a topic title, suggest a parent subject, propose facets, and structure the thoughts.
9. A new card appears on the user's grid at magpie.wiki: "From iMessage." Tapping it shows the proposed topic with the Convo thread preserved as a Convo mode session, and the captured thoughts pre-populated in Maggie mode. The user accepts, edits, or moves it.

---

## Integration: schema additions

Three small additions to the existing schema:

```sql
-- Link a user to their iMessage phone number.
alter table user_settings add column phone_number text unique;

-- Mark where a topic came from.
alter table topics add column source text not null default 'manual'
  check (source in ('manual', 'ai_assist', 'imessage', 'discover'));

-- Distinguish iMessage conversations from in-app Convo.
alter table conversations add column kind text not null default 'convo'
  check (kind in ('convo', 'imessage', 'drawout'));

-- An inbox for iMessage-originated content that has not been organized yet.
create table imessage_inbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  conversation_id uuid references conversations(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'dismissed')),
  proposed_title text,
  proposed_subject text,
  proposed_facets text[],
  organized_at timestamptz,
  created_at timestamptz default now()
);
create index imessage_inbox_user_id_idx on imessage_inbox(user_id, status);

alter table imessage_inbox enable row level security;
create policy "Own imessage_inbox: select" on imessage_inbox for select using (auth.uid() = user_id);
create policy "Own imessage_inbox: insert" on imessage_inbox for insert with check (auth.uid() = user_id);
create policy "Own imessage_inbox: update" on imessage_inbox for update using (auth.uid() = user_id);
create policy "Own imessage_inbox: delete" on imessage_inbox for delete using (auth.uid() = user_id);
```

Put this in `supabase/migrations/0002_hackathon.sql` so the base schema stays clean and the hackathon work is its own migration.

---

## Integration: Krava wrapper

> **The pseudocode below is superseded.** It predates the live BYO docs. The real Krava API is a POST to `https://krava.io/api/platform/chat` with `{ message, system }` and a Bearer userToken (SSE response, no model/max_tokens). Follow `docs/SOP_KRAVA.md` for the accurate, timed runbook. The one-file-change principle below still holds.

The whole point of the queries spine is that wrapping the AI layer is a one-file change. `lib/ai/client.ts` becomes:

```ts
import Anthropic from '@anthropic-ai/sdk';
import { createKravaPlatformClient } from '@kravalabs/api-client';

const useKrava = !!process.env.KRAVA_APP_KEY;

const krava = useKrava
  ? createKravaPlatformClient({ appKey: process.env.KRAVA_APP_KEY! })
  : null;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Wrap callClaude: if Krava is configured, route through it.
// Otherwise fall back to direct Anthropic.
export async function callClaude(args: CallClaudeArgs): Promise<string> {
  if (krava) {
    // Krava-mediated call. User must be provisioned first via krava.users.getOrCreate.
    // The userToken carries identity-anonymized session context.
    const { userToken } = await krava.users.getOrCreate(args.userId);
    const response = await krava.messages.create({
      userToken,
      model: args.model,
      max_tokens: args.maxTokens,
      system: args.system,
      messages: args.messages ?? [{ role: 'user', content: args.user! }],
    });
    return extractText(response);
  }
  // Direct fallback path.
  const response = await anthropic.messages.create({ /* same shape */ });
  return extractText(response);
}
```

Same pattern for `streamClaude`. The fallback path is important: if Krava is down or the SDK has a bug during the hackathon, Magpie still works.

`KRAVA_APP_KEY` goes in `.env.local` and `.env.example`. Get the key from the Krava platform at krava.io/platform during the event.

**Confirm at hackathon kickoff:** the exact API shape for `krava.messages.create` (signature may differ slightly from this pseudocode), how userToken flows through streaming responses, and whether Krava handles the Anthropic system prompt format directly or needs conversion. Krava's docs at `github.com/kravalabs/privy-ai-starter` are the source of truth.

---

## Integration: Linq webhook

New route: `app/api/linq/webhook/route.ts`. This is the entry point for incoming iMessages.

Pseudocode:

```ts
export async function POST(req: Request) {
  // 1. Verify the webhook signature (HMAC, see Linq partner docs)
  // 2. Parse the payload: phone_number, message text, service (iMessage/RCS/SMS), media
  // 3. Look up user by phone_number in user_settings
  // 4. If no user, send "please sign up at magpie.wiki" reply via Linq API and return
  // 5. Find or create an active iMessage conversation for this user
  //    ("active" = last activity within 60 minutes)
  // 6. Append the user message to conversations.messages
  // 7. Build the Convo prompt with full history + Maggie persona name
  // 8. Stream from Claude (Krava-wrapped). Collect the full response.
  // 9. Send the response back via Linq's outbound API
  // 10. Append assistant message to conversations.messages
  // 11. Update conversations.updated_at (triggers the idle-timer for Organize)
}
```

Outbound helper: `lib/linq/send.ts` wraps Linq's send-message API. Add `LINQ_API_TOKEN` and `LINQ_PHONE_NUMBER` to env.

Reference: `linqapp.com/s/use-cases/ai-agent` has the open-source Claude-powered iMessage agent example. Copy its webhook shape, auth header pattern, and outbound endpoint usage. Their patterns work, we are not improving on them.

Active conversation logic: a conversation is "active" if it has activity in the last 60 minutes. After that, the next message starts a new conversation row. This becomes the natural unit for an Organize pass.

---

## Integration: the Organize pass for iMessage conversations

When a conversation goes idle (cron job or manual trigger), or the user texts "save", "done", "wrap it", or similar:

1. Pull the full message history from `conversations.messages`.
2. Run the Extract prompt (already in `lib/ai/prompts.ts`) against the user's messages to propose a topic title, subject, and facets.
3. Insert a row in `imessage_inbox` with the proposed values and a link to the conversation.
4. Optionally text the user back: "saved. take a look at your wiki when you get a chance."

When the user visits magpie.wiki, an "iMessage Inbox" card on the home grid shows pending items. Tapping one:
- Shows the conversation history (read-only preview)
- Lets the user accept the proposed title, subject, and facets, or edit them
- On accept: create a topic with `source = 'imessage'`, link the conversation via `topic_id`, set `kind = 'imessage'`, and the user message bullets become initial thoughts in the topic.

The Convo mode tab on the resulting topic shows the actual iMessage thread, and the user can continue it from either iMessage or the web. Same conversation, two surfaces.

---

## Build order on hackathon day

Six-hour window (12 PM to 6:30 PM). Aggressive but doable because most of Magpie is already built. Assumes magpie.wiki is already live from the pre-hackathon SOP in `BUILD_PLAN.md`.

| Hour | Work |
|---|---|
| 0 to 0.5 | Get Krava `APP_KEY` from sponsor table. Get Linq sandbox `API_TOKEN` and phone number. Read the Krava quickstart and the Linq partner V3 docs. |
| 0.5 to 1 | Apply migration `0002_hackathon.sql`. Add `KRAVA_APP_KEY`, `LINQ_API_TOKEN`, `LINQ_PHONE_NUMBER` to env. |
| 1 to 2 | Wrap `lib/ai/client.ts` with Krava. Add the fallback path. Test by hitting an existing Convo route in the running app and confirming it works through Krava. |
| 2 to 3.5 | Build `app/api/linq/webhook/route.ts` and `lib/linq/send.ts`. Use the Linq AI agent example as a template. Test by texting the Linq sandbox number from a real phone and watching the webhook fire. |
| 3.5 to 4.5 | Build the iMessage inbox view at `app/(main)/page.tsx` (a card on home that lists pending items). Build the accept flow that turns an inbox item into a real topic. |
| 4.5 to 5.5 | Polish the demo path. Run through it three times start to finish. Fix the rough edges. |
| 5.5 to 6 | Write the project description. Confirm the GitHub repo is public. Update homepage-hackathon.html with the real Linq phone number. |
| 6 to 6.5 | Final test. Submit at the form. |

---

## The 5-minute demo

Open laptop with magpie.wiki on screen (already logged in). Pull out phone. Text Maggie at the live Linq number with something specific (the dystopias/utopias prompt from the homepage-hackathon.html iMessage thread is a tested demo seed). Have a 60 to 90 second exchange. Tell Maggie to "save."

Switch to the laptop. Show the new iMessage inbox card. Open it. Show the conversation captured, the proposed organization (topic title, subject, facets), and the accept flow. Click accept. Show the topic now in the grid with the Convo thread preserved.

Wrap with the privacy thesis: "A wiki of someone's actual curiosity is more revealing than their search history. So Magpie runs every AI call through Krava: passkey identity, AES-256 encrypted memory, inference inside H100 TEEs. Maggie never knows who you are. The model never sees who you are. Privacy as infrastructure."

Three minutes of clean flow beats five minutes of feature tour.

---

## What to submit

Per the hackathon submission form on the Luma event:

- **Deployed app URL:** magpie.wiki
- **Team name:** Chris's choice
- **Participant names:** Chris and any teammates
- **Short project description (200 to 400 words):** lead with the privacy thesis (wiki of real curiosity is high-stakes data), then the Krava integration architecture, then the Linq bonus angle
- **Track:** **Best Krava Project ($500)** as the primary, with **Best Krava + Linq Integration ($250)** as the bonus shot
- **Explanation of how Krava is used:** it wraps `lib/ai/client.ts` so every AI call (Brief, Challenge, Questions, Convo, Organize, Extract, Related) routes through Krava's privacy infrastructure. Specific emphasis: the Convo prompt for iMessage conversations carries the highest privacy stakes because users text their actual half-formed thinking. Krava's PrivateLLM ensures the model runs in an attested TEE and Krava's PasskeyID ensures user identity is never coupled with the request.
- **Explanation of Linq integration:** a webhook plus outbound API integration that turns iMessage into a Magpie capture surface. Users text Maggie at a real Linq Blue number, conversations are organized into wiki topics automatically via the Extract prompt.
- **GitHub repo:** push the bootstrap repo with the hackathon work on a branch, make it public for the submission.

---

## What NOT to do

- Do not rebuild Magpie around the hackathon. The wiki is the product. iMessage is a new input. Krava is a privacy upgrade. Both are wrappers around the existing thing.
- Do not skip the Krava fallback path. If their SDK breaks or rate-limits during the demo, Magpie has to still work end-to-end.
- Do not over-engineer the inbox view. A simple list with accept and dismiss buttons is enough for the demo.
- Do not get cute with the demo. Three minutes of clear flow beats five minutes of feature tour.
- Do not try to use the live Krava production keys for testing. Use the sandbox keys until the demo run.

---

## Post-hackathon: is this a keeper?

- **Krava in production:** Krava's value proposition (privacy infrastructure baked in, not bolted on) is real and matches Magpie's data sensitivity. Keep the integration after the hackathon. The wrapper pattern is correct regardless of long-term vendor choice.
- **Linq in production:** yes, this is the iMessage version of Magpie, and it stays. It is also the natural delivery channel for the "Daily Magpie" idea from `FUTURE_FEATURES.md` (iMessage > email for that use case).
- **iMessage as the wedge:** this is the real find. Texting Maggie is a lower-friction way to capture a thought than opening an app, and "the wiki on the web is the long memory" is a clean two-surface story.

---

## Networking notes

The strategic reason for this hackathon is not just the prize money. Chris met the Krava founder previously and likes them. Showing up with a real product that integrates the Krava SDK as a real architectural decision (not a prop) is the strongest possible signal of taking their thesis seriously.

Walk in with magpie.wiki already live and the bootstrap visible. Most other teams will be wrapping LLMs with no product around them. We have a product. We are adding privacy. That is a much better story for a privacy-themed hackathon.

---

## Update: locked decisions (2026-05-29, pre-event)

These sharpen the plan above, decided the night before the event. **Read this section first when starting the hackathon session.**

### Where the build is
Phases 1 to 5 are done, tested, and deployed. The base app (grid, capture, Brief/Challenge/Questions/Convo, persisted conversations) is live on **magpie.wiki**. The Level 1 identity seam is closed on `master`: `callClaude`/`streamClaude` accept a `userId` and every AI route threads the authenticated user's id. So Krava is a one-file change with zero route edits.

### The split (ABANDONED 2026-05-30, session 5)
- **No split.** `master` is the single build line and deploys to **magpie.wiki**. There is no `hackathon` branch and no `hackathon.magpie.wiki`.
- Krava, Linq, the iMessage inbox, and `0002_hackathon.sql` all land on `master` and ship to magpie.wiki.
- The submission repo is this repo (`dogsleddev/magpie`, already public) on `master`.
- The Linq webhook is therefore `https://magpie.wiki/api/linq/webhook` (no subdomain).

### Krava (primary track: Best Krava Project, BYO path)
- Wrap `lib/ai/client.ts` only. `callClaude` and `streamClaude` already receive `args.userId`. Fill in the Krava branch: `getOrCreate(args.userId)` then a Krava-mediated call; keep the direct-Anthropic fallback gated on `!process.env.KRAVA_APP_KEY` so the demo survives an SDK hiccup.
- Level 2 (Krava PasskeyID as the actual login) is intentionally skipped. Level 1 (per-user id to the inference layer) is enough to demo the privacy thesis. Reconsider only if a judge specifically wants passwordless.
- Confirm the exact SDK shape from the BYO quickstart at kickoff before wiring.

### Linq (bonus track), confirmed from docs.linqapp.com
- Auth: `Authorization: Bearer <LINQ_API_KEY>`. Token + phone number from the Linq rep at the event.
- Inbound webhook at `app/api/linq/webhook/route.ts`. Headers: `X-Webhook-Timestamp`, `X-Webhook-Signature`, `X-Webhook-Event`. Verify HMAC-SHA256 over `"{timestamp}.{rawBody}"` with the signing secret. Read `req.text()` for the raw body BEFORE parsing, constant-time compare, reject stale timestamps. Handle `message.received`. Return 2xx within 10s, dedupe on `event_id` (at-least-once delivery, up to 10 retries).
- Outbound via `lib/linq/send.ts`: POST `https://api.linqapp.com/api/partner/v3/chats` (new chat) or `/chats/{chatId}/messages` (reply). Body `{ from, to: ["+1..."], message: { parts: [{ type: "text", value }] } }`. **No links in outbound messages** (URLs are rejected). Maggie speaks prose, so fine.
- The webhook needs a public URL: `https://magpie.wiki/api/linq/webhook` (already public from the deploy, no tunnel needed).
- Link your own phone to your user: one update to `user_settings.phone_number` once you have the Linq number.

### Tiered demo goal (lock Tier 0 first)
- **Tier 0 (must-have):** text Maggie at the Linq number from your phone on stage, she replies in voice over iMessage. Needs webhook + send + your phone linked.
- **Tier 1 (the wow):** text "save", a "From iMessage" card appears on the grid, open it to show the captured convo + proposed topic.
- **Tier 2 (stretch):** accept, topic appears with the Convo preserved, continuable from the web. Never bet the demo on this.

### Scaffolding (first tasks of the hackathon session, on the `hackathon` branch)
1. `supabase/migrations/0002_hackathon.sql` (phone_number, topics.source, conversations.kind, imessage_inbox) per the schema section above. Apply to the shared Supabase project; it is additive, master ignores it.
2. `app/api/linq/webhook/route.ts` HMAC verification + parse (the shape is testable before the token arrives).
3. `lib/linq/send.ts` outbound helper.
4. The Krava branch inside `lib/ai/client.ts`.
Then wire the real tokens, link your phone, and drill the demo loop three times.

### Collect at the event
Krava `APP_KEY` + the BYO quickstart. Linq bearer token, a Linq Blue number, and the webhook signing secret.

### Pre-decided
Tracks: Best Krava Project (primary) + Best Krava + Linq Integration (bonus). Demo seed: the dystopias/utopias prompt (pre-tested). Team name: TODO, set before submission.
