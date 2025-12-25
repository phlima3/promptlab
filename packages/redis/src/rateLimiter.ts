import { getRedisClient } from "./client.js";

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  maxRequests: number;
  /**
   * Time window in seconds
   */
  windowSeconds: number;
  /**
   * Key prefix for Redis keys
   */
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  total: number;
}

/**
 * Sliding window rate limiter using Redis
 *
 * Uses sorted sets with timestamps as scores for accurate sliding window.
 *
 * Trade-offs:
 * - More accurate than fixed window (no edge case spikes)
 * - More storage than token bucket (keeps all request timestamps)
 * - O(log N) complexity for zadd/zcount operations
 *
 * Failure modes:
 * - Redis unavailable: throws error (fail-closed for security)
 * - Network timeout: throws after retries
 *
 * What I'd improve:
 * - Add fallback to in-memory limiter if Redis is down
 * - Add metrics for rate limit hits
 * - Support different limits per tier (free/paid users)
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  const prefix = config.keyPrefix || "ratelimit";
  const key = `${prefix}:${identifier}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const windowStart = now - windowMs;

  // Use pipeline for atomic operations
  const pipeline = redis.pipeline();

  // Remove old entries outside the window
  pipeline.zremrangebyscore(key, 0, windowStart);

  // Add current request
  pipeline.zadd(key, now, `${now}`);

  // Count requests in window
  pipeline.zcard(key);

  // Set expiry (cleanup)
  pipeline.expire(key, config.windowSeconds * 2);

  const results = await pipeline.exec();

  if (!results) {
    throw new Error("Rate limit check failed: no results from Redis");
  }

  // Extract count from zcard result
  // results[2] = [err, count]
  const countResult = results[2];
  if (countResult[0]) {
    throw countResult[0];
  }

  const currentCount = countResult[1] as number;
  const allowed = currentCount <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - currentCount);

  // Calculate reset time (when oldest request expires)
  const resetAt = new Date(now + windowMs);

  return {
    allowed,
    remaining,
    resetAt,
    total: config.maxRequests,
  };
}

/**
 * Reset rate limit for an identifier (useful for testing or admin override)
 */
export async function resetRateLimit(
  identifier: string,
  keyPrefix = "ratelimit"
): Promise<void> {
  const redis = getRedisClient();
  const key = `${keyPrefix}:${identifier}`;
  await redis.del(key);
}
