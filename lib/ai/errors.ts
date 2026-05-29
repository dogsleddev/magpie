import { NextResponse } from 'next/server';

/**
 * Maps an Anthropic SDK error to a clean, client-safe JSON response.
 * Shared by every AI route so the failure messaging stays consistent.
 */
export function aiErrorResponse(err: unknown): NextResponse {
  const status = (err as { status?: number }).status;
  const message = String((err as { message?: string }).message ?? '');

  if (status === 401 || status === 403) {
    return NextResponse.json({ error: 'Add your Anthropic key to .env.local.' }, { status: 422 });
  }
  if (/credit balance|billing|insufficient|quota/i.test(message)) {
    return NextResponse.json(
      { error: 'Maggie is out of Anthropic credits. Add credits to continue.' },
      { status: 402 },
    );
  }
  return NextResponse.json({ error: 'Maggie could not answer right now. Try again.' }, { status: 502 });
}
