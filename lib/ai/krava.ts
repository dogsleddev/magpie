/**
 * Krava privacy layer for the AI client.
 *
 * When KRAVA_APP_KEY is set, AI calls route through Krava's platform chat:
 * inference in attested TEEs, identity decoupled from the request. When it is
 * not set, the caller falls back to direct Anthropic, so the app always works.
 *
 * Verified shape (probe, 2026-05-30):
 *   identity: krava.users.getOrCreate(externalUserId) -> { userToken }
 *   chat:     POST {base}/api/platform/chat
 *             Authorization: Bearer <userToken>
 *             body { message, system }
 *             -> text/event-stream: `data: {"text":"..."}` deltas, `data: [DONE]` to end
 */
import { createKravaPlatformClient } from '@kravalabs/api-client';

const appKey = process.env.KRAVA_APP_KEY;
export const kravaEnabled = !!appKey;

const krava = appKey ? createKravaPlatformClient({ appKey }) : null;
const CHAT_URL = `${process.env.KRAVA_BASE_URL ?? 'https://krava.io'}/api/platform/chat`;

// externalUserId -> userToken, cached per server instance (getOrCreate is idempotent).
const tokenCache = new Map<string, string>();

async function tokenFor(externalUserId: string): Promise<string> {
  if (!krava) throw new Error('Krava is not configured');
  const cached = tokenCache.get(externalUserId);
  if (cached) return cached;
  const { userToken } = await krava.users.getOrCreate(externalUserId);
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
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') return;
      try {
        const json = JSON.parse(data) as { text?: string };
        if (json.text) yield json.text;
      } catch {
        // non-JSON keep-alive line, ignore
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
  for await (const delta of kravaChatStream(args)) out += delta;
  return out.trim();
}
