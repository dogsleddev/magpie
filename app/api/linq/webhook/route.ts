import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { convoSystemPrompt } from '@/lib/ai/prompts';
import { callClaude, modelFor, MAX_TOKENS } from '@/lib/ai/client';
import { adminEnabled, createAdminClient } from '@/lib/supabase/admin';
import { linqEnabled, sendImessage } from '@/lib/linq/send';
import {
  getOrCreateActiveImessageConversation,
  setConversationMessages,
} from '@/lib/linq/store';
import type { ConversationMessage } from '@/lib/queries/types';

export const runtime = 'nodejs';

// In-memory dedupe (Linq delivers at-least-once, up to 10 retries). Per-instance
// only, which is fine for the demo's volume.
const seenEvents = new Set<string>();

function verifySignature(secret: string, timestamp: string, rawBody: string, sig: string): boolean {
  // CONFIRM encoding (hex vs base64) and any prefix against Linq's docs at the event.
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(sig.replace(/^sha256=/i, ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  // Never expose an open, AI-spending endpoint: require full config.
  if (!linqEnabled || !adminEnabled || !process.env.LINQ_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Linq not configured' }, { status: 503 });
  }
  const secret = process.env.LINQ_WEBHOOK_SECRET;

  const raw = await req.text(); // raw body BEFORE parsing, for HMAC
  const ts = req.headers.get('x-webhook-timestamp') ?? '';
  const sig = req.headers.get('x-webhook-signature') ?? '';
  const eventHeader = req.headers.get('x-webhook-event') ?? '';

  // Reject unsigned or stale requests (tolerant to seconds, ms, or ISO timestamps).
  const tsNum = Number(ts);
  const tsMs = Number.isFinite(tsNum) ? (ts.length <= 10 ? tsNum * 1000 : tsNum) : Date.parse(ts);
  if (!ts || !Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > 5 * 60 * 1000) {
    return NextResponse.json({ error: 'stale or missing timestamp' }, { status: 401 });
  }
  if (!sig || !verifySignature(secret, ts, raw, sig)) {
    return NextResponse.json({ error: 'bad signature' }, { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }

  // Defensive parse; CONFIRM field names against Linq's docs at the event.
  const eventType = eventHeader || payload.event || payload.type;
  if (eventType && eventType !== 'message.received') {
    return NextResponse.json({ ok: true, ignored: eventType });
  }

  const data = payload.data ?? payload.message ?? payload;
  const phone: string | undefined =
    payload.from ?? payload.phone_number ?? data.from ?? data.phone_number ?? data.sender;
  const text: string | undefined =
    data.text ??
    payload.text ??
    (typeof data === 'string' ? data : undefined) ??
    (Array.isArray(data.parts) ? data.parts.map((p: { value?: string }) => p.value ?? '').join(' ') : undefined);
  const chatId: string | undefined = payload.chat_id ?? payload.chatId ?? data.chat_id ?? data.chatId;
  const eventId: string = payload.event_id ?? payload.id ?? data.id ?? sig.slice(0, 32);

  if (!phone || !text?.trim()) {
    return NextResponse.json({ ok: true, skipped: 'no phone or text' });
  }
  if (seenEvents.has(eventId)) {
    return NextResponse.json({ ok: true, deduped: true });
  }
  seenEvents.add(eventId);

  try {
    const admin = createAdminClient();

    const { data: settings } = await admin
      .from('user_settings')
      .select('user_id, persona_name')
      .eq('phone_number', phone)
      .maybeSingle();

    if (!settings?.user_id) {
      await sendImessage({
        to: phone,
        text: "hey, i don't recognize this number yet. sign up on the magpie site and link your number in settings, then text me back here.",
      });
      return NextResponse.json({ ok: true, unknownUser: true });
    }

    const userId: string = settings.user_id;
    const personaName: string = settings.persona_name ?? 'Maggie';

    const convo = await getOrCreateActiveImessageConversation(admin, userId);
    const history: ConversationMessage[] = [...convo.messages, { role: 'user', content: text.trim() }];
    const title = (convo.messages[0]?.content ?? text).slice(0, 80);

    const reply = await callClaude({
      model: modelFor('convo'),
      system: convoSystemPrompt({ id: convo.id, title }, personaName),
      messages: history,
      maxTokens: MAX_TOKENS.convo,
      userId, // Krava routes per-user when KRAVA_APP_KEY is set
    });

    await sendImessage({ to: phone, text: reply, chatId });
    await setConversationMessages(admin, convo.id, [...history, { role: 'assistant', content: reply }]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    seenEvents.delete(eventId); // let a Linq retry reprocess
    console.error('[linq webhook]', err);
    return NextResponse.json({ error: 'processing failed' }, { status: 500 });
  }
}
