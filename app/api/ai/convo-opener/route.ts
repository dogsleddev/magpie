import { NextResponse } from 'next/server';
import { getTopic } from '@/lib/queries/topics';
import { getSettings } from '@/lib/queries/settings';
import { callClaude, MODELS } from '@/lib/ai/client';
import { convoOpenerPrompt } from '@/lib/ai/prompts';
import { requireUser } from '@/lib/supabase/server';

/**
 * The persona's opening line for a fresh topic chat: one short, personal,
 * topic-specific question. Generated on demand (not cached) so it stays warm
 * and a little different each visit. The client falls back to a generic line if
 * this errors.
 */
export async function POST(request: Request) {
  let topicId: string | undefined;
  try {
    const body = (await request.json()) as { topicId?: string };
    topicId = body.topicId;
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }
  if (!topicId) return NextResponse.json({ error: 'Missing topicId.' }, { status: 400 });

  const [{ id: userId }, topic, settings] = await Promise.all([
    requireUser(),
    getTopic(topicId),
    getSettings(),
  ]);
  if (!topic) return NextResponse.json({ error: 'Topic not found.' }, { status: 404 });

  const prompt = convoOpenerPrompt({ id: topic.id, title: topic.title }, settings.persona_name);
  try {
    const raw = await callClaude({
      model: MODELS.haiku,
      system: prompt.system,
      user: prompt.user,
      maxTokens: 64,
      userId,
    });
    const opener = raw
      .trim()
      .split('\n')[0]
      .replace(/^["']|["']$/g, '')
      .trim();
    return NextResponse.json({ opener });
  } catch {
    return NextResponse.json({ opener: '' });
  }
}
