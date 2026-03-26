"use client";

import { useAuth } from "./use-auth";

export function usePermissions() {
  const { permissions, roles } = useAuth();

  const isSuperAdmin = roles.includes("SUPER_ADMIN");

  /** Check if user has a specific permission */
  function can(permissionCode: string): boolean {
    if (isSuperAdmin) return true;
    return permissions.includes(permissionCode);
  }

  /** Check if user has ANY of the specified permissions */
  function canAny(...codes: string[]): boolean {
    if (isSuperAdmin) return true;
    return codes.some((c) => permissions.includes(c));
  }

  /** Check if user has ALL of the specified permissions */
  function canAll(...codes: string[]): boolean {
    if (isSuperAdmin) return true;
    return codes.every((c) => permissions.includes(c));
  }

  /** Check if user has a specific role */
  function hasRole(roleName: string): boolean {
    return roles.includes(roleName);
  }

  /** Check if user has ANY of the specified roles */
  function hasAnyRole(...roleNames: string[]): boolean {
    return roleNames.some((r) => roles.includes(r));
  }

  return { can, canAny, canAll, hasRole, hasAnyRole, isSuperAdmin };
}
