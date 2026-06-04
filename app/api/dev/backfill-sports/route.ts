import { NextResponse } from 'next/server';
import { backfillSports } from '@/lib/actions/backfill-sports';

/**
 * Dev-only one-time backfill: visit this route while logged in to add the Sports
 * subject and its topics to your account. Idempotent. Disabled in production.
 * Safe to delete once you've run it.
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'dev only' }, { status: 403 });
  }
  try {
    const result = await backfillSports();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
