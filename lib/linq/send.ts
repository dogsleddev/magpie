/**
 * Outbound iMessage via the Linq partner API.
 *
 * Shape per docs/HACKATHON_KRAVA_LINQ.md (confirmed from docs.linqapp.com).
 * CONFIRM the exact endpoint + body against the rep's docs at the event, the
 * way we confirmed Krava's SSE shape.
 *
 * No links in outbound messages (Linq rejects URLs). Maggie/Magpie speaks prose.
 */
const BASE = 'https://api.linqapp.com/api/partner/v3';

export const linqEnabled = !!(process.env.LINQ_API_TOKEN && process.env.LINQ_PHONE_NUMBER);

export async function sendImessage(args: {
  to: string;
  text: string;
  chatId?: string;
}): Promise<void> {
  const token = process.env.LINQ_API_TOKEN;
  const from = process.env.LINQ_PHONE_NUMBER;
  if (!token || !from) throw new Error('LINQ_API_TOKEN and LINQ_PHONE_NUMBER are required');

  const url = args.chatId ? `${BASE}/chats/${args.chatId}/messages` : `${BASE}/chats`;
  const message = { parts: [{ type: 'text', value: args.text }] };
  const body = args.chatId ? { from, message } : { from, to: [args.to], message };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Linq send failed: ${res.status} ${await res.text()}`);
  }
}
