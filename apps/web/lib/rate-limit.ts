import { getRedis } from "./redis";

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function rateLimit(key: string, limit = 30, windowSec = 60): Promise<RateLimitResult> {
  if (process.env.RATE_LIMIT_ENABLED === "false") {
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowSec * 1000 };
  }

  const redis = getRedis();
  const redisKey = `sempt:rate:${key}`;
  const now = Date.now();
  const resetAt = now + windowSec * 1000;

  if (redis) {
    try {
      const count = await redis.incr(redisKey);
      if (count === 1) await redis.expire(redisKey, windowSec);
      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetAt
      };
    } catch {
      // Fall through to memory limiter when Redis is unavailable.
    }
  }

  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    memoryBuckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  bucket.count += 1;
  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt
  };
}
