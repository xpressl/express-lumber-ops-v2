import { prisma } from "@/lib/prisma";
import { safeGet, safeSetex, safeDel } from "@/lib/redis";
import type { ScopeType } from "@prisma/client";

const CACHE_TTL = 300; // 5 minutes
const CACHE_PREFIX = "perms:";

/** Full permission entry with scope info */
export interface ResolvedPermission {
  code: string;
  scopeType: ScopeType;
  scopeValue: string | null;
  fieldRestrictions: Record<string, boolean> | null;
  conditions: Record<string, unknown> | null;
}

/** Check if a user has a specific permission */
export async function hasPermission(userId: string, permissionCode: string): Promise<boolean> {
  const perms = await getUserPermissions(userId);
  return perms.some((p) => p.code === permissionCode);
}

/** Check if a user can access a specific entity within scope rules */
export async function canAccess(
  userId: string,
  permissionCode: string,
  entityLocationId?: string,
  entityOwnerId?: string,
): Promise<boolean> {
  const perms = await getUserPermissions(userId);
  const perm = perms.find((p) => p.code === permissionCode);
  if (!perm) return false;

  switch (perm.scopeType) {
    case "ALL":
      return true;
    case "BRANCH": {
      if (!entityLocationId) return true;
      const userLocations = await getUserLocationIds(userId);
      return userLocations.includes(entityLocationId);
    }
    case "OWN":
      return entityOwnerId === userId;
    case "ASSIGNED":
      // For ASSIGNED scope, the entity must be assigned to this user
      return entityOwnerId === userId;
    case "TEAM":
      // Team scope: check if entity owner is in same team/location
      if (!entityLocationId) return true;
      const teamLocations = await getUserLocationIds(userId);
      return teamLocations.includes(entityLocationId);
    case "READ_ONLY":
      // Read-only scope: only allow VIEW actions
      return perm.code.includes(".view");
    default:
      return false;
  }
}

/** Get all resolved permissions for a user (with caching) */
export async function getUserPermissions(userId: string): Promise<ResolvedPermission[]> {
  const cacheKey = `${CACHE_PREFIX}${userId}`;

  const cached = await safeGet(cacheKey);
  if (cached) return JSON.parse(cached) as ResolvedPermission[];

  const assignments = await prisma.userRoleAssignment.findMany({
    where: {
      userId,
      revokedAt: null,
      OR: [{ isTemporary: false }, { expiresAt: { gt: new Date() } }],
    },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  const permMap = new Map<string, ResolvedPermission>();
  for (const assignment of assignments) {
    for (const rp of assignment.role.permissions) {
      const existing = permMap.get(rp.permission.code);
      // If permission already exists, keep the broader scope
      if (!existing || scopePriority(rp.scopeType) > scopePriority(existing.scopeType)) {
        permMap.set(rp.permission.code, {
          code: rp.permission.code,
          scopeType: rp.scopeType,
          scopeValue: rp.scopeValue,
          fieldRestrictions: rp.fieldRestrictions as Record<string, boolean> | null,
          conditions: rp.conditions as Record<string, unknown> | null,
        });
      }
    }
  }

  const result = Array.from(permMap.values());

  await safeSetex(cacheKey, CACHE_TTL, JSON.stringify(result));

  return result;
}

/** Get location IDs the user has access to */
export async function getUserLocationIds(userId: string): Promise<string[]> {
  const assignments = await prisma.userRoleAssignment.findMany({
    where: { userId, revokedAt: null, locationId: { not: null } },
    select: { locationId: true },
  });
  return assignments.map((a) => a.locationId).filter((id): id is string => id !== null);
}

/** Invalidate cached permissions for a user */
export async function invalidatePermissionCache(userId: string): Promise<void> {
  await safeDel(`${CACHE_PREFIX}${userId}`);
}

/** Get field restrictions for a user on a specific resource type */
export async function getFieldRestrictions(
  userId: string,
  permissionCode: string,
): Promise<Record<string, boolean> | null> {
  const perms = await getUserPermissions(userId);
  const perm = perms.find((p) => p.code === permissionCode);
  return perm?.fieldRestrictions ?? null;
}

/** Scope priority: higher = broader access */
function scopePriority(scope: ScopeType): number {
  switch (scope) {
    case "ALL": return 6;
    case "BRANCH": return 5;
    case "TEAM": return 4;
    case "ASSIGNED": return 3;
    case "OWN": return 2;
    case "READ_ONLY": return 1;
    default: return 0;
  }
}
