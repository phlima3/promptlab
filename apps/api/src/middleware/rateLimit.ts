import { Request, Response, NextFunction } from "express";
import { checkRateLimit, RateLimitConfig } from "@promptlab/redis";

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
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Use IP as identifier (can be enhanced with user ID from auth)
      const identifier = req.ip || req.socket.remoteAddress || "unknown";

      const result = await checkRateLimit(identifier, config);

      // Add rate limit headers
      res.setHeader("X-RateLimit-Limit", result.total.toString());
      res.setHeader("X-RateLimit-Remaining", result.remaining.toString());
      res.setHeader("X-RateLimit-Reset", result.resetAt.toISOString());

      if (!result.allowed) {
        res.status(429).json({
          error: {
            code: "rate_limited",
            message: "Too many requests. Please try again later.",
            details: {
              limit: result.total,
              resetAt: result.resetAt.toISOString(),
            },
          },
        });
        return;
      }

      next();
    } catch (error) {
      console.error("[RateLimit] Middleware error:", error);
      // Fail closed: if Redis is down, block requests to prevent abuse
      res.status(503).json({
        error: {
          code: "service_unavailable",
          message: "Rate limiting service temporarily unavailable",
          details: {},
        },
      });
    }
  };
}
