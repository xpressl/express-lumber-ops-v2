import { getUserPermissions, getUserLocationIds } from "@/lib/permissions/evaluate";
import type { SessionUser } from "@/lib/auth/options";

/** Build a Prisma where-clause filter based on user's resolved permission scope */
export async function buildScopeFilter(
  user: SessionUser,
  permissionCode: string,
  options: {
    locationField?: string;
    ownerField?: string;
  } = {},
): Promise<Record<string, unknown>> {
  const { locationField = "locationId", ownerField = "createdBy" } = options;

  // Super admin sees everything
  if (user.roles.includes("SUPER_ADMIN") || user.roles.includes("OWNER")) {
    return {};
  }

  // Resolve the user's scope for this specific permission from the DB/cache
  const permissions = await getUserPermissions(user.id);
  const perm = permissions.find((p) => p.code === permissionCode);

  if (!perm) {
    // No permission at all - restrict to nothing
    return { id: "__no_access__" };
  }

  switch (perm.scopeType) {
    case "ALL":
      return {};

    case "BRANCH": {
      const locationIds = await getUserLocationIds(user.id);
      if (locationIds.length > 0) {
        return { [locationField]: { in: locationIds } };
      }
      if (user.defaultLocationId) {
        return { [locationField]: user.defaultLocationId };
      }
      return {};
    }

    case "OWN":
      return { [ownerField]: user.id };

    case "ASSIGNED":
      return {
        OR: [{ [ownerField]: user.id }, { assignedTo: user.id }],
      };

    case "TEAM": {
      const locationIds = await getUserLocationIds(user.id);
      if (locationIds.length > 0) {
        return { [locationField]: { in: locationIds } };
      }
      return {};
    }

    case "READ_ONLY":
      return {};

    default:
      return {};
  }
}

/** Add soft-delete filter (exclude deleted records) */
export function withSoftDelete(where: Record<string, unknown>): Record<string, unknown> {
  return { ...where, deletedAt: null };
}

/** Merge scope filter with additional query filters */
export function mergeFilters(...filters: Record<string, unknown>[]): Record<string, unknown> {
  const nonEmpty = filters.filter((f) => Object.keys(f).length > 0);
  if (nonEmpty.length === 0) return {};
  if (nonEmpty.length === 1) return nonEmpty[0]!;
  return { AND: nonEmpty };
}
