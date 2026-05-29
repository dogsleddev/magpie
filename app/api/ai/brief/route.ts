import { handleTextMode } from '@/lib/ai/text-mode';
import { briefPrompt } from '@/lib/ai/prompts';

export async function POST(request: Request) {
  return handleTextMode(request, 'brief', briefPrompt);
}
