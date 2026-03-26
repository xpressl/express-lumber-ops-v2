import { prisma } from "@/lib/prisma";
import { safeGet, safeSetex, safeKeys, safeDel } from "@/lib/redis";
import type { FlagState } from "@prisma/client";

const CACHE_TTL = 60; // 1 minute (flags change more frequently during rollout)
const CACHE_PREFIX = "flags:";

/** Evaluate a single feature flag for a user */
export async function isFeatureEnabled(
  flagCode: string,
  context: {
    userId?: string;
    roles?: string[];
    locationId?: string;
  },
): Promise<boolean> {
  const state = await evaluateFlag(flagCode, context);
  return state === "ON" || state === "BETA";
}

/** Evaluate a feature flag and return its state */
export async function evaluateFlag(
  flagCode: string,
  context: {
    userId?: string;
    roles?: string[];
    locationId?: string;
  },
): Promise<FlagState> {
  const cacheKey = `${CACHE_PREFIX}${flagCode}:${context.userId ?? "anon"}:${context.locationId ?? "any"}`;

  const cached = await safeGet(cacheKey);
  if (cached) return cached as FlagState;

  const flag = await prisma.featureFlag.findUnique({
    where: { code: flagCode },
    include: { assignments: true },
  });

  if (!flag) return "OFF";

  // Resolution hierarchy: user > role > branch > company > default
  // More specific assignments override less specific ones
  let resolvedState: FlagState = flag.defaultState;

  // 1. Company-level override
  const companyAssignment = flag.assignments.find((a) => a.level === "COMPANY");
  if (companyAssignment) resolvedState = companyAssignment.state;

  // 2. Branch-level override
  if (context.locationId) {
    const branchAssignment = flag.assignments.find(
      (a) => a.level === "BRANCH" && a.targetId === context.locationId,
    );
    if (branchAssignment) resolvedState = branchAssignment.state;
  }

  // 3. Role-level override (any matching role wins)
  if (context.roles) {
    for (const role of context.roles) {
      const roleAssignment = flag.assignments.find(
        (a) => a.level === "ROLE" && a.targetId === role,
      );
      if (roleAssignment) {
        resolvedState = roleAssignment.state;
        break;
      }
    }
  }

  // 4. User-level override (highest priority)
  if (context.userId) {
    const userAssignment = flag.assignments.find(
      (a) => a.level === "USER" && a.targetId === context.userId,
    );
    if (userAssignment) resolvedState = userAssignment.state;
  }

  await safeSetex(cacheKey, CACHE_TTL, resolvedState);

  return resolvedState;
}

/** Evaluate all flags for a user context (for client-side hydration) */
export async function evaluateAllFlags(context: {
  userId?: string;
  roles?: string[];
  locationId?: string;
}): Promise<Record<string, FlagState>> {
  const flags = await prisma.featureFlag.findMany({
    include: { assignments: true },
  });

  const result: Record<string, FlagState> = {};
  for (const flag of flags) {
    result[flag.code] = await evaluateFlag(flag.code, context);
  }

  return result;
}

/** Invalidate all flag caches (call after flag changes) */
export async function invalidateFlagCache(): Promise<void> {
  const keys = await safeKeys(`${CACHE_PREFIX}*`);
  if (keys.length > 0) {
    await safeDel(...keys);
  }
}
