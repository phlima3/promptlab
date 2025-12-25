# @promptlab/redis

Redis utilities for PromptLab: rate limiting and caching.

## Features

- **Rate Limiting**: Sliding window rate limiter with accurate request counting
- **Caching**: Simple cache layer for expensive operations (LLM calls)
- **Connection Management**: Redis client wrapper with reconnection and error handling

## Installation

```bash
yarn workspace @promptlab/redis add ioredis
```

## Usage

### Rate Limiting

```typescript
import { checkRateLimit } from "@promptlab/redis";

const result = await checkRateLimit("user-123", {
  maxRequests: 100,
  windowSeconds: 60,
  keyPrefix: "api-ratelimit",
});

if (!result.allowed) {
  console.log(`Rate limited. Try again at ${result.resetAt}`);
}
```

### Express Middleware

```typescript
import { rateLimitMiddleware } from "@promptlab/api/middleware/rateLimit";

app.use(
  rateLimitMiddleware({
    maxRequests: 100,
    windowSeconds: 60,
  })
);
```

### Caching

```typescript
import { getCached, setCached, getOrSet } from "@promptlab/redis";

// Manual cache control
const cached = await getCached<string>("my-key");
if (!cached) {
  const value = await expensiveOperation();
  await setCached("my-key", value, { ttl: 3600 });
}

// Or use getOrSet pattern
const result = await getOrSet(
  "my-key",
  async () => {
    return await expensiveOperation();
  },
  { ttl: 3600 }
);
```

## Architecture

### Rate Limiter

Uses Redis sorted sets with timestamps as scores for accurate sliding window:

- O(log N) complexity for zadd/zcount
- More accurate than fixed window (no edge case spikes)
- More storage than token bucket (keeps all request timestamps)

**Failure mode**: Fail-closed (blocks requests if Redis is unavailable)

### Cache

Simple key-value storage with TTL support:

- Transparent serialization/deserialization (JSON)
- Graceful degradation on errors (returns null)
- Background cache updates (don't block response)

**Failure mode**: Fail-open (cache miss on Redis errors, operation continues)

## Configuration

Environment variables:

```bash
REDIS_URL="redis://localhost:6379"
```

## Trade-offs

### Rate Limiter

**Pros:**

- Accurate sliding window (no boundary issues)
- Distributed (works across multiple API instances)
- Persistent (survives restarts)

**Cons:**

- Requires Redis (additional infrastructure)
- Network latency on every request
- O(log N) storage per user

**Alternative**: In-memory limiter (faster, but doesn't work with horizontal scaling)

### Cache

**Pros:**

- Huge cost savings (99.9% for duplicate LLM calls)
- Fast response times (ms instead of seconds)
- Configurable TTL

**Cons:**

- Memory usage in Redis
- Stale data risk (mitigated by TTL)
- Serialization overhead

**Alternative**: No cache (simpler, but expensive and slow)

## Testing

See `scripts/test-phase7.sh` for integration tests.

## Interview Talking Points

### "Why sliding window over fixed window?"

- Fixed window has edge case: 100 req at 00:59, 100 req at 01:01 = 200 req/min
- Sliding window counts requests in a rolling 60s period
- More storage, but accurate

### "Why fail-closed on rate limiter errors?"

- Security over availability
- Prevents uncontrolled traffic if Redis is down
- Alternative: fail-open + alert for monitoring

### "How do you handle Redis downtime?"

- Rate limiter: blocks requests (fail-closed)
- Cache: degrades gracefully (cache miss, continues)
- Future: add fallback to in-memory with circuit breaker

### "What about cache invalidation?"

- TTL handles most cases (1 hour for LLM results)
- Manual invalidation via `deleteCached`
- Future: cache tags for bulk invalidation

## What I'd improve

1. **Metrics**: Track hit rate, latency, errors
2. **Cache warming**: Pre-populate cache for common queries
3. **Compression**: Compress large values before storing
4. **Circuit breaker**: Fall back to in-memory on Redis issues
5. **Multi-region**: Replicate cache across regions
