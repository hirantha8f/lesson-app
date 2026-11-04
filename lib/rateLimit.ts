// In-memory sliding-window rate limiter (Finding unauth-paid-llm-burn).
// Caps anonymous spend on the billed LLM routes. Single-instance only:
// use a shared store (e.g. Upstash) when running multi-instance/serverless
// at scale, and note a whole classroom behind one NAT IP shares a bucket —
// tune LESSON_LIMIT/GUIDE_LIMIT accordingly.

type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();

function prune(b: Bucket, now: number, windowMs: number) {
  while (b.hits.length && b.hits[0] <= now - windowMs) b.hits.shift();
}

export function checkRateLimit(key: string, limit: number, windowMs: number): {
  ok: boolean;
  retryAfterSec: number;
} {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b) {
    b = { hits: [] };
    buckets.set(key, b);
  }
  prune(b, now, windowMs);
  if (b.hits.length >= limit) {
    const retryAfterSec = Math.ceil((b.hits[0] + windowMs - now) / 1000);
    return { ok: false, retryAfterSec: Math.max(retryAfterSec, 1) };
  }
  b.hits.push(now);
  // Opportunistic cleanup so the map cannot grow unboundedly.
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      prune(v, now, windowMs);
      if (!v.hits.length) buckets.delete(k);
      if (buckets.size <= 5_000) break;
    }
  }
  return { ok: true, retryAfterSec: 0 };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

// Full caller authentication (Supabase JWT) is the follow-up once the
// classroom store is wired (Primer change); the rate limit below is the
// immediate spend control that keeps anonymous demos working.
export const LESSON_LIMIT = { limit: 10, windowMs: 5 * 60_000 };
export const GUIDE_LIMIT = { limit: 20, windowMs: 5 * 60_000 };
// Authenticated callers prove identity via Supabase JWT, so they earn
// roomier buckets on the same endpoints.
export const AUTH_LESSON_LIMIT = { limit: 60, windowMs: 5 * 60_000 };
export const AUTH_GUIDE_LIMIT = { limit: 120, windowMs: 5 * 60_000 };
