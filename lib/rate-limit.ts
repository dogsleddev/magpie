/**
 * Minimal in-memory fixed-window rate limiter. State lives per serverless/edge
 * instance and is not shared across instances, so this blunts casual abuse of
 * the one-click (unauthenticated) AI endpoints rather than enforcing a hard
 * global quota. Swap for a durable store (KV/Upstash) if traffic grows.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { ok: boolean; retryAfter: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    // Opportunistic sweep so unique-IP churn cannot grow the map without bound.
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (now >= v.resetAt) buckets.delete(k);
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

/**
 * The trusted client IP for rate-limit keying. On Vercel, `x-real-ip` is the
 * real peer address; the leftmost `x-forwarded-for` entry is whatever the client
 * sent (spoofable), so we prefer x-real-ip and otherwise take the LAST forwarded
 * hop (the one the platform appended), never the first.
 */
export function clientIp(h: { get(name: string): string | null }): string {
  const real = h.get('x-real-ip');
  if (real?.trim()) return real.trim();
  const xff = h.get('x-forwarded-for');
  if (xff) {
    const parts = xff.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return 'unknown';
}
