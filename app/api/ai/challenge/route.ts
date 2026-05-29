import { handleTextMode } from '@/lib/ai/text-mode';
import { challengePrompt } from '@/lib/ai/prompts';

export async function POST(request: Request) {
  return handleTextMode(request, 'challenge', challengePrompt);
}
