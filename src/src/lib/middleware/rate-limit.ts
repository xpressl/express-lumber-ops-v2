import { redis } from "@/lib/redis";
import { errorResponse } from "./error-handler";
import type { NextResponse } from "next/server";

interface RateLimitConfig {
  /** Max requests within the window */
  max: number;
  /** Window size in seconds */
  windowSeconds: number;
  /** Key prefix for Redis */
  prefix?: string;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  max: 60,
  windowSeconds: 60,
  prefix: "rl:",
};

/** Check rate limit for a given identifier (userId, IP, etc.) */
export async function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {},
): Promise<{ allowed: boolean; remaining: number; resetAt: Date; response?: NextResponse }> {
  const { max, windowSeconds, prefix } = { ...DEFAULT_CONFIG, ...config };
  const key = `${prefix}${identifier}`;

  try {
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    const ttl = await redis.ttl(key);
    const resetAt = new Date(Date.now() + ttl * 1000);
    const remaining = Math.max(0, max - current);

    if (current > max) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        response: errorResponse(429, "RATE_LIMITED", "Too many requests. Please try again later."),
      };
    }

    return { allowed: true, remaining, resetAt };
  } catch {
    // If Redis is down, allow the request (fail open)
    return { allowed: true, remaining: max, resetAt: new Date(Date.now() + windowSeconds * 1000) };
  }
}

/** Rate limit configs for different endpoint types */
export const RATE_LIMITS = {
  auth: { max: 10, windowSeconds: 60, prefix: "rl:auth:" },
  api: { max: 60, windowSeconds: 60, prefix: "rl:api:" },
  upload: { max: 10, windowSeconds: 300, prefix: "rl:upload:" },
  export: { max: 5, windowSeconds: 60, prefix: "rl:export:" },
} as const;
