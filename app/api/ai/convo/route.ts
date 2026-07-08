import { NextResponse } from 'next/server';
import { getTopic } from '@/lib/queries/topics';
import { getSettings } from '@/lib/queries/settings';
import { getConversation } from '@/lib/queries/conversations';
import { streamClaude, modelFor, MAX_TOKENS } from '@/lib/ai/client';
import { convoSystemPrompt } from '@/lib/ai/prompts';
import { CONVO_STREAM_ERROR_MARK } from '@/lib/ai/stream-markers';
import { requireUser } from '@/lib/supabase/server';
import type { ConversationMessage } from '@/lib/queries/types';

export async function POST(request: Request) {
  let topicId: string | undefined;
  let message: string | undefined;
  try {
    const body = (await request.json()) as { topicId?: string; message?: string };
    topicId = body.topicId;
    message = body.message;
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }
  if (!topicId || !message?.trim()) {
    return NextResponse.json({ error: 'Missing topicId or message.' }, { status: 400 });
  }
  // The /api/ai limiter caps request count, not size. Bound the message so one
  // request cannot send an oversized (expensive) prompt to the model.
  if (message.length > 4000) {
    return NextResponse.json({ error: 'Message is too long.' }, { status: 413 });
  }
  const userMessage = message.trim();

  // Reads run in parallel, in request scope (cookies valid). Persistence is
  // client-driven after a clean stream (saveConvoTurn), so a mid-stream failure
  // never writes a turn. We also drop a dangling trailing user turn left by a
  // prior aborted stream, so we never send consecutive user messages (which the
  // Anthropic API rejects with a 400).
  const [, topic, settings, convo] = await Promise.all([
    requireUser(),
    getTopic(topicId),
    getSettings(),
    getConversation(topicId),
  ]);
  if (!topic) {
    return NextResponse.json({ error: 'Topic not found.' }, { status: 404 });
  }

  let history = (convo?.messages ?? []) as unknown as ConversationMessage[];
  while (history.length > 0 && history[history.length - 1]?.role === 'user') {
    history = history.slice(0, -1);
  }
  // Window the model input to the most recent turns. On the shared account a
  // popular topic's thread grows without bound, and once it exceeds the context
  // window every send would 400 forever. The full thread is still stored and
  // shown to the user; only what we send the model is capped.
  const MAX_HISTORY = 30;
  if (history.length > MAX_HISTORY) {
    history = history.slice(-MAX_HISTORY);
    // The API requires the first message to be a user turn, so drop a leading
    // assistant turn left by the slice.
    const firstUser = history.findIndex((m) => m.role === 'user');
    history = firstUser === -1 ? [] : history.slice(firstUser);
  }
  const messages: ConversationMessage[] = [...history, { role: 'user', content: userMessage }];

  const system = convoSystemPrompt({ id: topic.id, title: topic.title }, settings.persona_name);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamClaude({
          model: modelFor('convo'),
          system,
          messages,
          maxTokens: MAX_TOKENS.convo,
        })) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        const status = (err as { status?: number }).status;
        const note =
          (status === 401 || status === 403) && process.env.NODE_ENV !== 'production'
            ? 'add your anthropic key to keep chatting.'
            : `${settings.persona_name.toLowerCase()} hit a snag. try again in a sec.`;
        // The marker tells the client this is an error note (not model output),
        // so it shows the note but never persists it as a real assistant turn.
        controller.enqueue(encoder.encode(CONVO_STREAM_ERROR_MARK + note));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
