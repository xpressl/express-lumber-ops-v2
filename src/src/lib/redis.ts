import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

/** Circuit breaker state: after a failure, skip Redis for CIRCUIT_OPEN_MS */
let circuitOpen = false;
let circuitOpenUntil = 0;
const CIRCUIT_OPEN_MS = 60_000; // 60 seconds

function isCircuitOpen(): boolean {
  if (!circuitOpen) return false;
  if (Date.now() > circuitOpenUntil) {
    circuitOpen = false;
    return false;
  }
  return true;
}

function tripCircuit(): void {
  circuitOpen = true;
  circuitOpenUntil = Date.now() + CIRCUIT_OPEN_MS;
}

function createRedisClient(): Redis {
  const redis = new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
    maxRetriesPerRequest: 1,
    connectTimeout: 1_000,
    commandTimeout: 2_000,
    retryStrategy(times) {
      // Only retry once, then give up
      if (times > 1) return null;
      return 500;
    },
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  redis.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message);
    tripCircuit();
  });

  return redis;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

/**
 * Safe Redis GET: returns null if Redis is unavailable.
 * Falls back instantly via circuit breaker -- never blocks the app.
 */
export async function safeGet(key: string): Promise<string | null> {
  if (isCircuitOpen()) return null;
  try {
    return await redis.get(key);
  } catch {
    tripCircuit();
    return null;
  }
}

/**
 * Safe Redis SETEX: silently fails if Redis is unavailable.
 * Never blocks the app.
 */
export async function safeSetex(key: string, ttlSeconds: number, value: string): Promise<void> {
  if (isCircuitOpen()) return;
  try {
    await redis.setex(key, ttlSeconds, value);
  } catch {
    tripCircuit();
  }
}

/**
 * Safe Redis DEL: silently fails if Redis is unavailable.
 */
export async function safeDel(...keys: string[]): Promise<void> {
  if (isCircuitOpen()) return;
  try {
    await redis.del(...keys);
  } catch {
    tripCircuit();
  }
}

/**
 * Safe Redis INCR: returns null if Redis is unavailable (caller should fail-open).
 */
export async function safeIncr(key: string): Promise<number | null> {
  if (isCircuitOpen()) return null;
  try {
    return await redis.incr(key);
  } catch {
    tripCircuit();
    return null;
  }
}

/**
 * Safe Redis EXPIRE: silently fails if Redis is unavailable.
 */
export async function safeExpire(key: string, seconds: number): Promise<void> {
  if (isCircuitOpen()) return;
  try {
    await redis.expire(key, seconds);
  } catch {
    tripCircuit();
  }
}

/**
 * Safe Redis TTL: returns -1 if Redis is unavailable.
 */
export async function safeTtl(key: string): Promise<number> {
  if (isCircuitOpen()) return -1;
  try {
    return await redis.ttl(key);
  } catch {
    tripCircuit();
    return -1;
  }
}

/**
 * Safe Redis KEYS: returns empty array if Redis is unavailable.
 */
export async function safeKeys(pattern: string): Promise<string[]> {
  if (isCircuitOpen()) return [];
  try {
    return await redis.keys(pattern);
  } catch {
    tripCircuit();
    return [];
  }
}
