/**
 * Magpie Anthropic Claude client.
 * All AI calls go through here, server-side only.
 */

import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  // Throw at boot rather than silently failing on first AI call
  throw new Error('ANTHROPIC_API_KEY is missing. Add it to .env.local');
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================
// Model selection
// ============================================

export const MODELS = {
  sonnet: 'claude-sonnet-4-5-20250929',
  haiku: 'claude-haiku-4-5-20251001',
} as const;

export type ModelKey = keyof typeof MODELS;

/**
 * Pick the right model for a given AI task.
 * See docs/PROMPTS.md for the rationale.
 */
export function modelFor(
  task: 'brief' | 'challenge' | 'convo' | 'organize' | 'extract' | 'related' | 'questions' | 'drawout' | 'drawout_score',
): string {
  switch (task) {
    case 'brief':
    case 'related':
    case 'questions':
      return MODELS.haiku;
    case 'challenge':
    case 'convo':
    case 'organize':
    case 'extract':
    case 'drawout':
    case 'drawout_score':
      return MODELS.sonnet;
  }
}

// ============================================
// Token budgets
// ============================================

export const MAX_TOKENS = {
  brief: 500,
  challenge: 500,
  convo: 300,
  organize: 600,
  extract: 800,
  related: 300,
  questions: 400,
  drawout: 300,
  drawout_score: 600,
} as const;

// ============================================
// Unified call helper for non-streaming responses
// ============================================

export type CallClaudeArgs = {
  model: string;
  system: string;
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  user?: string;
  maxTokens: number;
};

export async function callClaude(args: CallClaudeArgs): Promise<string> {
  const messages = args.messages ?? (args.user ? [{ role: 'user' as const, content: args.user }] : []);
  if (messages.length === 0) {
    throw new Error('callClaude needs either user or messages');
  }
  const response = await anthropic.messages.create({
    model: args.model,
    max_tokens: args.maxTokens,
    system: args.system,
    messages,
  });
  return response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as { type: 'text'; text: string }).text)
    .join('\n')
    .trim();
}

// ============================================
// Streaming helper for Convo mode
// ============================================

export async function* streamClaude(args: CallClaudeArgs): AsyncGenerator<string> {
  const messages = args.messages ?? (args.user ? [{ role: 'user' as const, content: args.user }] : []);
  const stream = await anthropic.messages.stream({
    model: args.model,
    max_tokens: args.maxTokens,
    system: args.system,
    messages,
  });
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}
