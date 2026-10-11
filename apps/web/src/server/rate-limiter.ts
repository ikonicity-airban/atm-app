/**
 * Simple In-Memory Rate Limiter
 * Provides an interface that can easily be swapped for Upstash Redis in production.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

export interface IRateLimiter {
  check(key: string, limit: number, windowSeconds: number): RateLimitResult;
}

class InMemoryRateLimiter implements IRateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();

  check(key: string, limit: number, windowSeconds: number): RateLimitResult {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const record = this.hits.get(key);

    if (!record || record.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + windowMs });
      return {
        allowed: true,
        remaining: limit - 1,
        resetSeconds: windowSeconds,
      };
    }

    if (record.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetSeconds: Math.ceil((record.resetAt - now) / 1000),
      };
    }

    record.count++;
    return {
      allowed: true,
      remaining: limit - record.count,
      resetSeconds: Math.ceil((record.resetAt - now) / 1000),
    };
  }
}

export const rateLimiter: IRateLimiter = new InMemoryRateLimiter();
