import { NextResponse } from 'next/server';
import { backfillRedRising } from '@/lib/actions/backfill-red-rising';

/**
 * Dev-only one-time backfill: visit this route while logged in to regroup your
 * existing "Red Rising" sub-topics under a group. Disabled in production.
 * Safe to delete once you've run it.
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'dev only' }, { status: 403 });
  }
  try {
    const result = await backfillRedRising();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
