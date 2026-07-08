import { headers } from 'next/headers';
import { rateLimit, clientIp } from '@/lib/rate-limit';

/**
 * Non-throwing budget check for a Server Action, keyed by client IP. Returns
 * false when the caller is over budget so the action can DEGRADE (skip a paid
 * step) rather than fail. Server Actions POST to the page route, not `/api/ai/*`,
 * so they bypass the middleware limiter; the ones that spend money check here.
 * Do not import this from middleware (next/headers is not on the edge runtime).
 */
export async function allowAction(bucket: string, limit: number, windowMs = 60_000): Promise<boolean> {
  const ip = clientIp(await headers());
  return rateLimit(`${bucket}:${ip}`, limit, windowMs).ok;
}

/**
 * Throwing variant, reserved for destructive actions whose callers already
 * handle a rejected promise (an inline "try again", not a crash). Do NOT use it
 * on high-frequency capture paths or inside an unguarded `startTransition`.
 */
export async function limitAction(bucket: string, limit: number, windowMs = 60_000): Promise<void> {
  if (!(await allowAction(bucket, limit, windowMs))) {
    throw new Error('Too many requests. Give it a moment and try again.');
  }
}
