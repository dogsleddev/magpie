import { callClaude, MODELS } from '@/lib/ai/client';
import { connectionsPrompt, extractJSON, type ConnectionsOutput } from '@/lib/ai/prompts';
import type { TopicLite } from '@/lib/queries/topics';

export type Connection = { title: string; why: string; topicId: string | null };

/**
 * The middle verb: given a freshly caught glint and the caller's snapshot of the
 * existing curiosities, find the 1 or 2 it most genuinely connects to (a Haiku
 * semantic match over the titles, validated in scripts/connection-spike.mjs).
 * The caller passes the topic list so this can run in parallel with the capture
 * (the snapshot predates the new topic, so it never self-matches). Honest by
 * design: returns an empty list when nothing truly connects. Never throws; a
 * model failure just yields no chips.
 */
export async function findConnections(glint: string, topics: TopicLite[]): Promise<Connection[]> {
  if (topics.length === 0) return [];

  const titleToId = new Map(topics.map((t) => [t.title.toLowerCase().trim(), t.id]));
  const prompt = connectionsPrompt(
    glint,
    topics.map((t) => t.title),
  );

  let out: ConnectionsOutput | null = null;
  try {
    const raw = await callClaude({
      model: MODELS.haiku,
      system: prompt.system,
      user: prompt.user,
      maxTokens: 300,
    });
    out = extractJSON<ConnectionsOutput>(raw);
  } catch {
    out = null;
  }

  const matches = Array.isArray(out?.matches) ? out!.matches : [];
  return matches
    .filter((m): m is { title: string; why: string } => !!m && typeof m.title === 'string')
    .slice(0, 2)
    .map((m) => ({
      title: m.title,
      why: typeof m.why === 'string' ? m.why : '',
      topicId: titleToId.get(m.title.toLowerCase().trim()) ?? null,
    }));
}
