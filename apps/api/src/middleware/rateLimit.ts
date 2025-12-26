import {
  rateLimitMiddleware as rateLimitMiddlewareImpl,
  type RateLimitConfig,
} from "../lib/redis";

/**
 * Rate limiting middleware for Express
 *
 * Protects endpoints from abuse using Redis-backed sliding window limiter.
 *
 * Usage:
 *   app.use(rateLimitMiddleware({ maxRequests: 100, windowSeconds: 60 }))
 *
 * Trade-offs:
 * - Identifier strategy: IP-based (simple) vs user-based (needs auth)
 * - Fail-closed: if Redis is down, requests are blocked (security over availability)
 * - Alternative: could fail-open and log errors for monitoring
 *
 * Failure modes:
 * - Redis unavailable: returns 503 (prevents uncontrolled traffic)
 * - Network timeout: returns 503 after retries
 *
 * What I'd improve:
 * - Add whitelist for internal services
 * - Support multiple rate limit tiers (by user plan)
 * - Add X-RateLimit-* headers to all responses
 * - Implement distributed rate limiting for multi-region
 */
export function rateLimitMiddleware(config: RateLimitConfig) {
  return rateLimitMiddlewareImpl(config);
}

export type { RateLimitConfig };
