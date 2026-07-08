import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Only honor a same-origin, root-relative `next`. Reject '//host', backslashes
  // (browsers treat '\' as '/', so '/\evil.com' becomes protocol-relative), and
  // anything that resolves to a foreign origin. Otherwise fall back to /app.
  const raw = searchParams.get('next');
  let next = '/app';
  if (raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.includes('\\')) {
    const candidate = new URL(raw, origin);
    if (candidate.origin === origin) next = candidate.pathname + candidate.search;
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth', origin));
}
