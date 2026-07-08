import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { rateLimit, clientIp } from '@/lib/rate-limit';

// The AI routes call the paid Anthropic API and sit behind a one-click public
// login, so throttle them by client IP before doing anything else. 30/min is far
// above any real user's pace (a topic open fires a handful of calls) but stops a
// script from looping reroll and running up spend.
const AI_LIMIT = 30;
const AI_WINDOW_MS = 60_000;

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/ai/')) {
    const { ok, retryAfter } = rateLimit(`ai:${clientIp(request.headers)}`, AI_LIMIT, AI_WINDOW_MS);
    if (!ok) {
      return NextResponse.json(
        { error: 'Too many requests. Give it a moment.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      );
    }
  }

  try {
    return await updateSession(request);
  } catch {
    // If Supabase env is missing or the auth server is unreachable, do not
    // crash the request. Let the page-level guards handle redirects.
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    // Run on everything except Next internals, the auth callback, and static assets.
    '/((?!_next/static|_next/image|favicon.png|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
