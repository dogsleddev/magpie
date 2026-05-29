/**
 * Supabase middleware client used by /middleware.ts to refresh the session
 * cookie on each request.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // This refreshes the session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login for protected routes
  const protectedPaths = [
    '/',
    '/subject',
    '/topic',
    '/facet',
    '/facets',
    '/discover',
    '/journal',
    '/settings',
  ];
  const isProtected = protectedPaths.some(
    (p) => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(p + '/'),
  );

  if (isProtected && !user && request.nextUrl.pathname !== '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return response;
}
