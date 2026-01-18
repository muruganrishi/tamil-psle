/**
 * Simple in-memory rate limiting utility
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (consider Redis for production)
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining requests in current window */
  remaining: number;
  /** Time in ms until rate limit resets */
  resetIn: number;
}

/**
 * Check and update rate limit for a given key
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Clean up old entry if window has passed
  if (entry && now >= entry.resetAt) {
    rateLimitStore.delete(key);
  }

  const currentEntry = rateLimitStore.get(key);

  if (!currentEntry) {
    // First request in window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  if (currentEntry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetIn: currentEntry.resetAt - now,
    };
  }

  // Increment count
  currentEntry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - currentEntry.count,
    resetIn: currentEntry.resetAt - now,
  };
}

/**
 * Rate limit configurations for different API types
 */
export const RATE_LIMITS = {
  /** Meaning API: 60 requests per minute (AI calls are expensive) */
  meaning: {
    maxRequests: 60,
    windowMs: 60 * 1000,
  },
  /** OCR API: 10 requests per minute (heavy AI processing) */
  ocr: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
  /** Standard API: 100 requests per minute */
  standard: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },
  /** Write operations: 30 requests per minute */
  write: {
    maxRequests: 30,
    windowMs: 60 * 1000,
  },
  /** Auth operations: 10 requests per minute (prevent brute force) */
  auth: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
  /** Admin operations: 50 requests per minute */
  admin: {
    maxRequests: 50,
    windowMs: 60 * 1000,
  },
} as const satisfies Record<string, RateLimitConfig>;

/** @deprecated Use RATE_LIMITS.meaning instead */
export const MEANING_RATE_LIMIT: RateLimitConfig = RATE_LIMITS.meaning;

/**
 * Create a rate limit key for a user
 */
export function createUserRateLimitKey(userId: string, endpoint: string): string {
  return `${endpoint}:${userId}`;
}

/**
 * Create a rate limit key for IP-based limiting (for unauthenticated routes)
 */
export function createIpRateLimitKey(ip: string, endpoint: string): string {
  return `${endpoint}:ip:${ip}`;
}

// Clean up stale entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now >= entry.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
