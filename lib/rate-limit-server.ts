import { headers } from 'next/headers';
import { rateLimit, clientIp } from '@/lib/rate-limit';

/**
 * Rate-limit a Server Action by client IP. Server Actions POST to the page route,
 * not `/api/ai/*`, so they never pass through the middleware limiter; every
 * mutating action calls this directly. Do not import this from middleware (it
 * uses next/headers, which is not available in the edge runtime).
 */
export async function limitAction(bucket: string, limit: number, windowMs = 60_000): Promise<void> {
  const ip = clientIp(await headers());
  if (!rateLimit(`${bucket}:${ip}`, limit, windowMs).ok) {
    throw new Error('Too many requests. Give it a moment and try again.');
  }
}
