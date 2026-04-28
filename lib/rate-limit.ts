/**
 * In-memory sliding-window rate limiter.
 *
 * Why this and not Redis/KV:
 * - Prompet ships as a single-instance Next.js app and the bookmark route runs
 *   on the Node.js runtime, so a module-level Map is enough to defeat casual
 *   abuse (typing-into-form spam, runaway browser tabs).
 * - For multi-replica deployments swap the bucket impl with Upstash Redis or
 *   Vercel KV; the public API of `consume()` stays the same.
 *
 * Two limits are enforced together so a botnet rotating IPs still hits a wall:
 * - per-IP   : 12 requests / 60 s
 * - global   : 200 requests / 60 s (across all callers)
 */

export interface RateLimitConfig {
  windowMs: number;
  perIp: number;
  global: number;
}

export interface RateLimitVerdict {
  ok: boolean;
  /** Whole seconds until the caller may retry; 0 when ok. */
  retryAfter: number;
  /** Tokens left in the per-IP window; useful for X-RateLimit-Remaining. */
  remaining: number;
  limit: number;
}

interface BucketState {
  ipBuckets: Map<string, number[]>;
  globalBucket: number[];
  config: RateLimitConfig;
}

function makeBucket(config: RateLimitConfig): BucketState {
  return { ipBuckets: new Map(), globalBucket: [], config };
}

/** Drop timestamps older than `cutoff` from the head of a sorted array (in place). */
function trim(arr: number[], cutoff: number) {
  let i = 0;
  while (i < arr.length && arr[i] < cutoff) i++;
  if (i > 0) arr.splice(0, i);
}

export function consume(state: BucketState, ip: string): RateLimitVerdict {
  const { config } = state;
  const now = Date.now();
  const cutoff = now - config.windowMs;

  trim(state.globalBucket, cutoff);
  if (state.globalBucket.length >= config.global) {
    const oldest = state.globalBucket[0];
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((oldest + config.windowMs - now) / 1000)),
      remaining: 0,
      limit: config.global,
    };
  }

  const list = state.ipBuckets.get(ip) ?? [];
  trim(list, cutoff);
  if (list.length >= config.perIp) {
    const oldest = list[0];
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((oldest + config.windowMs - now) / 1000)),
      remaining: 0,
      limit: config.perIp,
    };
  }

  list.push(now);
  state.ipBuckets.set(ip, list);
  state.globalBucket.push(now);

  // Periodic cap on map size to prevent unbounded memory under churn.
  if (state.ipBuckets.size > 5_000) {
    for (const [key, arr] of state.ipBuckets) {
      trim(arr, cutoff);
      if (arr.length === 0) state.ipBuckets.delete(key);
    }
  }

  return {
    ok: true,
    retryAfter: 0,
    remaining: Math.max(0, config.perIp - list.length),
    limit: config.perIp,
  };
}

const buckets = new Map<string, BucketState>();

/** Lazy bucket — name uniquely identifies the limiter (e.g. route name). */
export function getLimiter(name: string, config: RateLimitConfig): BucketState {
  let b = buckets.get(name);
  if (!b) {
    b = makeBucket(config);
    buckets.set(name, b);
  }
  return b;
}

/** Best-effort caller IP from common proxy headers. */
export function ipFromRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("fly-client-ip") ??
    "unknown"
  );
}
