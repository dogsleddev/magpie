import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
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
