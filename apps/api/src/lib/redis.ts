// Local Redis wrapper to avoid ESM/CommonJS issues during build
// This file provides a CommonJS-compatible interface to the Redis package
// Redis is OPTIONAL - rate limiting is bypassed when Redis is not available

import type { Request, Response, NextFunction } from "express";
import Redis from "ioredis";

let redisClient: Redis | null = null;
let redisAvailable = false;
let redisInitialized = false;

export function getRedisClient(): Redis | null {
  // Only try to connect if REDIS_URL is configured
  if (!process.env.REDIS_URL) {
    if (!redisInitialized) {
      console.log("[Redis] REDIS_URL not configured - rate limiting disabled");
      redisInitialized = true;
    }
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        retryStrategy: (times: number) => {
          if (times > 3) {
            redisAvailable = false;
            return null;
          }
          return Math.min(times * 50, 2000);
        },
        reconnectOnError: (err: Error) => {
          const targetErrors = ["READONLY", "ECONNRESET"];
          return targetErrors.some((e) => err.message.includes(e));
        },
      });

      redisClient.on("error", (err: Error) => {
        console.error("[Redis] Connection error:", err.message);
        redisAvailable = false;
      });

      redisClient.on("connect", () => {
        console.log("[Redis] Connected successfully");
        redisAvailable = true;
      });

      redisInitialized = true;
    } catch (err) {
      console.error("[Redis] Failed to initialize:", err);
      redisClient = null;
      redisAvailable = false;
    }
  }
  return redisClient;
}

export function isRedisAvailable(): boolean {
  return redisAvailable && redisClient !== null;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  keyPrefix: string;
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
) {
  const client = getRedisClient();

  // If Redis is not available, allow the request (fail open)
  if (!client) {
    return {
      allowed: true,
      total: config.maxRequests,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowSeconds * 1000),
    };
  }

  try {
    const key = `${config.keyPrefix}:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - config.windowSeconds;

    // Remove old entries
    await client.zremrangebyscore(key, 0, windowStart);

    // Count current requests
    const current = await client.zcard(key);

    // Check if limit exceeded
    const allowed = current < config.maxRequests;

    if (allowed) {
      // Add new request
      await client.zadd(key, now, `${now}-${Math.random()}`);
      await client.expire(key, config.windowSeconds);
    }

    const resetAt = new Date((now + config.windowSeconds) * 1000);

    return {
      allowed,
      total: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - current - 1),
      resetAt,
    };
  } catch (error) {
    console.error("[Redis] Rate limit check failed:", error);
    // Fail open - allow request if Redis has issues
    return {
      allowed: true,
      total: config.maxRequests,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowSeconds * 1000),
    };
  }
}

export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const cached = await client.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error("[Redis] Cache get failed:", error);
    return null;
  }
}

export async function setCached(
  key: string,
  value: any,
  ttlSeconds: number = 3600
): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error("[Redis] Cache set failed:", error);
  }
}

export function rateLimitMiddleware(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = req.ip || req.socket.remoteAddress || "unknown";

      const result = await checkRateLimit(identifier, config);

      // Add rate limit headers
      res.setHeader("X-RateLimit-Limit", result.total.toString());
      res.setHeader("X-RateLimit-Remaining", result.remaining.toString());
      res.setHeader("X-RateLimit-Reset", result.resetAt.toISOString());

      if (!result.allowed) {
        return res.status(429).json({
          error: {
            code: "rate_limited",
            message: "Too many requests. Please try again later.",
            details: {
              limit: result.total,
              resetAt: result.resetAt.toISOString(),
            },
          },
        });
      }

      next();
    } catch (error) {
      console.error("Rate limit middleware error:", error);
      if (process.env.NODE_ENV === "production") {
        return res.status(503).json({
          error: {
            code: "service_unavailable",
            message: "Rate limiting service temporarily unavailable",
          },
        });
      }
      next();
    }
  };
}
