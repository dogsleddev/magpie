# Magpie · SOP: Wire Krava (timed runbook)

**Purpose:** route every Magpie AI call through Krava's privacy infrastructure (TEE inference, decoupled identity) as a **one-file change** to `lib/ai/client.ts`, with a hard fallback to direct Anthropic so the demo survives any Krava hiccup. Lands on `master`, deploys to magpie.wiki. No split.

**Why this is small:** `callClaude` and `streamClaude` already accept `args.userId` (the Level 1 seam from session 3). Every AI route already threads the authenticated user id. So Krava slots in behind these two functions with zero route edits.

**Total: ~2 hours** of focused work plus a demo drill. The unpredictable part is confirming Krava's exact SSE payload shape at kickoff (see Step 1).

---

## The real Krava API (from krava.io/hackathon/byo, fetched 2026-05-30)

> **This supersedes the pseudocode in `docs/HACKATHON_KRAVA_LINQ.md`.** That doc guessed `krava.messages.create({ model, max_tokens, messages })`. The live BYO API is different:

- **Install:** `npm install @kravalabs/api-client` (zero deps, Node 18+).
- **Client:** `createKravaPlatformClient({ appKey: process.env.KRAVA_APP_KEY })`. The client is used for **identity only**.
- **Provision a user:** `const { userToken } = await krava.users.getOrCreate(externalUserId)`. Idempotent: same `externalUserId` returns the same identity. Use our Supabase `userId` as `externalUserId`.
- **Chat:** a raw POST, authorized by the `userToken`, NOT a client method:
  ```
  POST https://krava.io/api/platform/chat
  Authorization: Bearer <userToken>
  Content-Type: application/json
  body: { "message": "<the user message>", "system": "<system prompt>" }
  ```
- **Response:** Server-Sent Events. `data:` lines carrying JSON, terminated by a `[DONE]` sentinel. Even non-streaming use accumulates the stream.
- **No `model` and no `max_tokens` parameters.** Krava's Private Inference Router picks the enclave/model. So on the Krava path our `modelFor()` and `MAX_TOKENS` are simply not sent. That is the point of Krava (it routes for privacy/latency/cost).
- **Not OpenAI- or Anthropic-compatible.** Proprietary shape.
- **Memory is automatic.** Krava extracts and encrypts salient facts per user. Relevant for the convo-memory decision below.

### Confirm at kickoff (the doc leaves these open)
1. **The SSE delta field name.** Log one raw chunk and look. The parser below tries `json.delta ?? json.content ?? json.choices?.[0]?.delta?.content`; pin it to the real field once seen. **This is the #1 thing to verify before trusting output.**
2. Whether there is a non-streaming endpoint or it is always SSE (we accumulate either way, so not blocking).
3. Whether the SDK exposes a chat helper instead of the raw fetch (use it if cleaner; the raw fetch is what the docs show).

---

## Step 0 · Collect + install (~15 min)
- Get `KRAVA_APP_KEY` from the Krava table / krava.io/platform.
- Add it to `.env.local` and to Vercel (Project > Settings > Environment Variables, Production). It is a server-side secret; never `NEXT_PUBLIC`.
- `npm install @kravalabs/api-client`.
- Add `KRAVA_APP_KEY=` to `.env.example`.

## Step 1 · Krava helper + confirm the SSE shape (~20 min)
Create `lib/ai/krava.ts` (new module, isolates the SDK + raw fetch):

```ts
import { createKravaPlatformClient } from '@kravalabs/api-client';

const appKey = process.env.KRAVA_APP_KEY;
export const kravaEnabled = !!appKey;
const krava = kravaEnabled ? createKravaPlatformClient({ appKey: appKey! }) : null;

const CHAT_URL = 'https://krava.io/api/platform/chat';
const tokenCache = new Map<string, string>(); // externalUserId -> userToken (per lambda)

async function tokenFor(externalUserId: string): Promise<string> {
  const hit = tokenCache.get(externalUserId);
  if (hit) return hit;
  const { userToken } = await krava!.users.getOrCreate(externalUserId);
  tokenCache.set(externalUserId, userToken);
  return userToken;
}

export async function* kravaChatStream(args: {
  externalUserId: string;
  system: string;
  message: string;
}): AsyncGenerator<string> {
  const token = await tokenFor(args.externalUserId);
  const res = await fetch(CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message: args.message, system: args.system }),
  });
  if (!res.ok || !res.body) throw new Error(`Krava chat failed: ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith('data:')) continue;
      const data = t.slice(5).trim();
      if (data === '[DONE]') return;
      try {
        const json = JSON.parse(data);
        // CONFIRM this field at kickoff (Step 1.1):
        const delta = json.delta ?? json.content ?? json.choices?.[0]?.delta?.content ?? '';
        if (delta) yield delta;
      } catch {
        // keep-alive / non-JSON line, ignore
      }
    }
  }
}

export async function kravaChat(args: {
  externalUserId: string;
  system: string;
  message: string;
}): Promise<string> {
  let out = '';
  for await (const d of kravaChatStream(args)) out += d;
  return out.trim();
}
```

**Then verify the shape:** temporarily log the first raw `data:` line from a real call and fix the `delta` field. Do not move on until text comes back clean.

## Step 2 · Wrap callClaude (non-streaming modes) (~25 min)
In `lib/ai/client.ts`, add a flatten helper and branch at the top of `callClaude`. Leave the existing direct-Anthropic body as the fallback.

```ts
import { kravaEnabled, kravaChat, kravaChatStream } from './krava';

function flattenToMessage(args: CallClaudeArgs): string {
  if (args.user) return args.user;
  return (args.messages ?? [])
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');
}

export async function callClaude(args: CallClaudeArgs): Promise<string> {
  if (kravaEnabled && args.userId) {
    return kravaChat({ externalUserId: args.userId, system: args.system, message: flattenToMessage(args) });
  }
  // ---- existing direct Anthropic path, unchanged ----
}
```
Test a single-shot mode in the running app (Brief or the Add Topic categorize): confirm it returns sensible text through Krava.

## Step 3 · Wrap streamClaude (Convo) (~25 min)
```ts
export async function* streamClaude(args: CallClaudeArgs): AsyncGenerator<string> {
  if (kravaEnabled && args.userId) {
    yield* kravaChatStream({ externalUserId: args.userId, system: args.system, message: flattenToMessage(args) });
    return;
  }
  // ---- existing direct Anthropic stream, unchanged ----
}
```
Test Convo end to end: opener, a couple of turns, reload (our Supabase persistence is untouched, so history still replays).

## Step 4 · Decide the convo-memory model (~15 min)
Krava keeps its own per-user memory. Two clean options:
- **Recommended for the demo:** keep our Supabase conversation as the source of truth and `flattenToMessage` the transcript into the single `message`. Krava still runs inference in the TEE; we keep full control of history and the existing reload behavior. Krava's auto-memory is harmless extra.
- **Per-topic isolation (optional):** if blended memory across topics is visible, pass a composite `externalUserId` like `${userId}:${topicId}`. Requires threading `topicId` into `CallClaudeArgs`. Skip unless it actually shows.

## Step 5 · Verify + deploy (~20 min)
- [ ] Every mode through Krava: Brief, Challenge, Questions, Convo, Organize, Add Topic categorize. All return clean text.
- [ ] **Fallback proven:** unset `KRAVA_APP_KEY` locally, restart, confirm direct Anthropic still works. This is the demo safety net.
- [ ] No `KRAVA_APP_KEY` in any client bundle (server-only; it never gets a `NEXT_PUBLIC` prefix).
- [ ] `npm run type-check`; clear `.next` then `npm run build`.
- [ ] Commit, push `master`, confirm the Vercel deploy serves.
- [ ] Add `KRAVA_APP_KEY` to Vercel Production and redeploy so prod runs through Krava.

## Fallback discipline (the rule that saves the demo)
Everything Krava is gated on `kravaEnabled` (`!!process.env.KRAVA_APP_KEY`). If Krava rate-limits or breaks on stage: remove the env var (or it is simply absent) and the app instantly reverts to direct Anthropic. Never let a Krava failure take down the five modes.

## The demo line
"A wiki of someone's real curiosity is more revealing than their search history. So every Magpie AI call runs through Krava: inference inside attested H100 TEEs, AES-256 memory, identity decoupled from the request. Magpie never knows who you are. The model never sees who you are. Privacy as infrastructure."

## STOP / next
Once Krava is live and the fallback is proven, Linq is next (`docs/HACKATHON_KRAVA_LINQ.md`): the webhook at `https://magpie.wiki/api/linq/webhook` reuses this same Krava-wrapped path, so iMessage conversations get the same privacy guarantee for free.
