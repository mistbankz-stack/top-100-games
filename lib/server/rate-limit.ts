type Bucket = {
  tokens: number;
  lastRefillMs: number;
};

type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSeconds: number; remaining: number };

const buckets = new Map<string, Bucket>();

export function tokenBucketLimit(params: {
  key: string;
  capacity: number;
  refillPerSecond: number;
}): RateLimitResult {
  const now = Date.now();
  const refillPerMs = params.refillPerSecond / 1000;

  let bucket = buckets.get(params.key);

  if (!bucket) {
    bucket = {
      tokens: params.capacity,
      lastRefillMs: now,
    };
    buckets.set(params.key, bucket);
  }

  const elapsedMs = Math.max(0, now - bucket.lastRefillMs);
  const refill = elapsedMs * refillPerMs;

  bucket.tokens = Math.min(params.capacity, bucket.tokens + refill);
  bucket.lastRefillMs = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { ok: true, remaining: Math.floor(bucket.tokens) };
  }

  const missing = 1 - bucket.tokens;
  const retryAfterSeconds = Math.ceil(missing / params.refillPerSecond);

  return { ok: false, retryAfterSeconds, remaining: 0 };
}

export function sweepOldBuckets(maxAgeMs: number = 15 * 60 * 1000) {
  const now = Date.now();

  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefillMs > maxAgeMs) {
      buckets.delete(key);
    }
  }
}