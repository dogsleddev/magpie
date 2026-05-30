import { NextResponse } from 'next/server';
import { getTopic } from '@/lib/queries/topics';
import { getCached, setCached, clearCached, type CacheMode } from '@/lib/queries/ai-cache';
import { callClaude, modelFor, MAX_TOKENS } from '@/lib/ai/client';
import type { AIPrompt, Topic as PromptTopic } from '@/lib/ai/prompts';
import { aiErrorResponse } from '@/lib/ai/errors';
import { requireUser } from '@/lib/supabase/server';

type TextTask = 'brief' | 'challenge' | 'questions';

/**
 * Shared handler for the cached single-shot text modes (Brief, Challenge,
 * Questions). Read-through ai_cache per topic: a hit returns instantly, a miss
 * calls the model and caches it. `reroll` clears the cache first.
 */
export async function handleTextMode(
  request: Request,
  task: TextTask,
  prompt: (topic: PromptTopic) => AIPrompt,
): Promise<Response> {
  let topicId: string | undefined;
  let reroll = false;
  try {
    const body = (await request.json()) as { topicId?: string; reroll?: boolean };
    topicId = body.topicId;
    reroll = Boolean(body.reroll);
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }
  if (!topicId) {
    return NextResponse.json({ error: 'Missing topicId.' }, { status: 400 });
  }

  const topic = await getTopic(topicId);
  if (!topic) {
    return NextResponse.json({ error: 'Topic not found.' }, { status: 404 });
  }

  const mode = task as CacheMode;
  if (reroll) await clearCached(topicId, mode);

  let content = await getCached(topicId, mode);
  if (!content) {
    const { id: userId } = await requireUser();
    const p = prompt({ id: topic.id, title: topic.title });
    try {
      content = await callClaude({
        model: modelFor(task),
        system: p.system,
        user: p.user,
        maxTokens: MAX_TOKENS[task],
        userId,
      });
    } catch (err) {
      return aiErrorResponse(err);
    }
    await setCached(topicId, mode, content);
  }

  return NextResponse.json({ content });
}
