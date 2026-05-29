import { handleTextMode } from '@/lib/ai/text-mode';
import { questionsPrompt } from '@/lib/ai/prompts';

export async function POST(request: Request) {
  return handleTextMode(request, 'questions', questionsPrompt);
}
