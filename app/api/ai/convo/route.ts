import { NextResponse } from 'next/server';
import { getTopic } from '@/lib/queries/topics';
import { getSettings } from '@/lib/queries/settings';
import { getConversation, appendMessage } from '@/lib/queries/conversations';
import { streamClaude, modelFor, MAX_TOKENS } from '@/lib/ai/client';
import { convoSystemPrompt } from '@/lib/ai/prompts';
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
  const userMessage = message.trim();

  // All Supabase reads/writes happen here, in request scope (cookies valid),
  // before the streaming Response is returned. The stream body below only talks
  // to Anthropic.
  const { id: userId } = await requireUser();
  const topic = await getTopic(topicId);
  if (!topic) {
    return NextResponse.json({ error: 'Topic not found.' }, { status: 404 });
  }
  const settings = await getSettings();
  const convo = await getConversation(topicId);
  const history = (convo?.messages ?? []) as unknown as ConversationMessage[];
  const messages: ConversationMessage[] = [...history, { role: 'user', content: userMessage }];

  await appendMessage(topicId, 'user', userMessage);

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
          userId,
        })) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        const status = (err as { status?: number }).status;
        const note =
          status === 401 || status === 403
            ? 'add your anthropic key to keep chatting.'
            : `${settings.persona_name.toLowerCase()} hit a snag. try again in a sec.`;
        controller.enqueue(encoder.encode(note));
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
