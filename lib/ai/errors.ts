import { NextResponse } from 'next/server';

/**
 * Maps an Anthropic SDK error to a clean, client-safe JSON response.
 * Shared by every AI route so the failure messaging stays consistent.
 */
export function aiErrorResponse(err: unknown): NextResponse {
  const status = (err as { status?: number }).status;
  const message = String((err as { message?: string }).message ?? '');

  if (status === 401 || status === 403) {
    // The .env.local hint is for the developer running locally; production
    // visitors should never see internal setup instructions.
    const error =
      process.env.NODE_ENV === 'production'
        ? 'Magpie could not answer right now. Try again.'
        : 'Add your Anthropic key to .env.local.';
    return NextResponse.json({ error }, { status: 422 });
  }
  if (/credit balance|billing|insufficient|quota/i.test(message)) {
    // Operator-facing detail only in dev; production visitors get a generic line.
    const error =
      process.env.NODE_ENV === 'production'
        ? 'Magpie could not answer right now. Try again.'
        : 'Magpie is out of Anthropic credits. Add credits to continue.';
    return NextResponse.json({ error }, { status: 402 });
  }
  return NextResponse.json({ error: 'Magpie could not answer right now. Try again.' }, { status: 502 });
}
