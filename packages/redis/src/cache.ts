import { getRedisClient } from "./client.js";

export interface CacheOptions {
  /**
   * Time to live in seconds
   */
  ttl?: number;
  /**
   * Key prefix for organization
   */
  keyPrefix?: string;
}

/**
 * Result cache for expensive operations (LLM calls)
 *
 * Trade-offs:
 * - Storage cost vs API cost (Redis cheap, LLM expensive → obvious win)
 * - Stale data risk (mitigated by TTL)
 * - Memory usage (mitigated by eviction policy)
 *
 * Failure modes:
 * - Redis unavailable: cache miss (degrade gracefully)
 * - Serialization error: log and skip cache
 *
 * What I'd improve:
 * - Add cache warming for common queries
 * - Support cache tags for bulk invalidation
 * - Add compression for large values
 * - Track hit rate metrics
 */

/**
 * Get cached value
 * Returns null if not found or Redis error
 */
export async function getCached<T>(
  key: string,
  options: CacheOptions = {}
): Promise<T | null> {
  try {
    const redis = getRedisClient();
    const prefix = options.keyPrefix || "cache";
    const fullKey = `${prefix}:${key}`;

    const cached = await redis.get(fullKey);
    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as T;
  } catch (error) {
    console.error("[Cache] Get error:", error);
    return null; // Fail gracefully
  }
}

/**
 * Set cached value
 * Returns true if successful, false on error
 */
export async function setCached<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const prefix = options.keyPrefix || "cache";
    const fullKey = `${prefix}:${key}`;
    const serialized = JSON.stringify(value);

    if (options.ttl) {
      await redis.setex(fullKey, options.ttl, serialized);
    } else {
      await redis.set(fullKey, serialized);
    }

    return true;
  } catch (error) {
    console.error("[Cache] Set error:", error);
    return false; // Fail gracefully
  }
}

/**
 * Delete cached value
 */
export async function deleteCached(
  key: string,
  options: CacheOptions = {}
): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const prefix = options.keyPrefix || "cache";
    const fullKey = `${prefix}:${key}`;

    await redis.del(fullKey);
    return true;
  } catch (error) {
    console.error("[Cache] Delete error:", error);
    return false;
  }
}

/**
 * Check if key exists in cache
 */
export async function existsCached(
  key: string,
  options: CacheOptions = {}
): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const prefix = options.keyPrefix || "cache";
    const fullKey = `${prefix}:${key}`;

    const exists = await redis.exists(fullKey);
    return exists === 1;
  } catch (error) {
    console.error("[Cache] Exists error:", error);
    return false;
  }
}

/**
 * Get or set pattern: try cache first, compute if miss, then cache result
 */
export async function getOrSet<T>(
  key: string,
  computeFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try cache first
  const cached = await getCached<T>(key, options);
  if (cached !== null) {
    return cached;
  }

  // Cache miss: compute value
  const value = await computeFn();

  // Store in cache (don't await to avoid blocking)
  setCached(key, value, options).catch((err) => {
    console.error("[Cache] Background set failed:", err);
  });

  return value;
}
