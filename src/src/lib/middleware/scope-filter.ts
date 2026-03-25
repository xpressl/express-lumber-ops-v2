import { getUserLocationIds } from "@/lib/permissions/evaluate";
import type { SessionUser } from "@/lib/auth/options";

/** Build a Prisma where-clause filter based on user scope */
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

  // Check the most restrictive scope from the user's permissions
  // For simplicity, use role-based scoping
  const isBranchScoped = !user.roles.some((r) =>
    ["GENERAL_MANAGER", "CREDIT_MANAGER", "AP_SUPPORT", "PRICING", "PURCHASING"].includes(r),
  );

  if (isBranchScoped) {
    const locationIds = await getUserLocationIds(user.id);
    if (locationIds.length > 0) {
      return { [locationField]: { in: locationIds } };
    }
    // If user has no location assignments, restrict to default location
    if (user.defaultLocationId) {
      return { [locationField]: user.defaultLocationId };
    }
  }

  // OWN scope: only see records you created or are assigned to
  const isOwnScoped = user.roles.some((r) => ["OUTSIDE_SALES"].includes(r));
  if (isOwnScoped && !user.permissions.includes(permissionCode)) {
    return { [ownerField]: user.id };
  }

  // ASSIGNED scope: only see records assigned to you
  const isAssignedScoped = user.roles.some((r) => ["DRIVER", "COLLECTIONS_REP"].includes(r));
  if (isAssignedScoped) {
    return {
      OR: [{ [ownerField]: user.id }, { assignedTo: user.id }],
    };
  }

  return {};
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
