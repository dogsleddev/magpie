import { NextResponse } from 'next/server';
import { getTopic } from '@/lib/queries/topics';
import { getSettings } from '@/lib/queries/settings';
import { addDiscoverItems } from '@/lib/queries/discover';
import { callClaude, modelFor, MAX_TOKENS } from '@/lib/ai/client';
import { organizePrompt, extractJSON, type OrganizeOutput } from '@/lib/ai/prompts';
import { aiErrorResponse } from '@/lib/ai/errors';
import { requireUser } from '@/lib/supabase/server';

export async function POST(request: Request) {
  let topicId: string | undefined;
  try {
    const body = (await request.json()) as { topicId?: string };
    topicId = body.topicId;
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

  const contents = topic.thoughts.map((t) => t.content).filter(Boolean);
  if (contents.length < 3) {
    return NextResponse.json({ error: 'Capture at least 3 thoughts to organize.' }, { status: 400 });
  }

  const prompt = organizePrompt({ id: topic.id, title: topic.title }, contents);

  await requireUser();

  let raw: string;
  try {
    raw = await callClaude({
      model: modelFor('organize'),
      system: prompt.system,
      user: prompt.user,
      maxTokens: MAX_TOKENS.organize,
    });
  } catch (err) {
    return aiErrorResponse(err);
  }

  const result = extractJSON<OrganizeOutput>(raw);
  if (!result) {
    return NextResponse.json(
      { error: 'Could not read the organized result. Try again.' },
      { status: 502 },
    );
  }

  // Side effect: feed the "learn more" topics into the Discover queue when the
  // user has AI suggestions on. Non-fatal: organizing still succeeds if this
  // insert fails.
  try {
    const settings = await getSettings();
    if (settings.ai_suggestions && result.learn_more?.length) {
      await addDiscoverItems(
        result.learn_more.map((title) => ({ title, source: `Organize · ${topic.title}` })),
      );
    }
  } catch {
    // swallow: Discover seeding is best-effort
  }

  return NextResponse.json({ result });
}
