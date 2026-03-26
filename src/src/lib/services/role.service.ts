import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/events/audit";
import { logSecurityEvent } from "@/lib/events/security";
import type { Actor } from "@/lib/events/audit-helpers";

export interface CreateRoleInput {
  name: string;
  displayName: string;
  description?: string;
  department?: string;
}

/** Create a new role */
export async function createRole(input: CreateRoleInput, actor: Actor) {
  const role = await prisma.role.create({ data: input });

  await createAuditEvent({
    actorId: actor.id,
    actorName: actor.name,
    action: "role.created",
    entityType: "Role",
    entityId: role.id,
    entityName: role.displayName,
  });

  return role;
}

/** Update a role */
export async function updateRole(roleId: string, input: Partial<CreateRoleInput>, actor: Actor) {
  const role = await prisma.role.update({
    where: { id: roleId },
    data: input,
  });

  await createAuditEvent({
    actorId: actor.id,
    actorName: actor.name,
    action: "role.updated",
    entityType: "Role",
    entityId: role.id,
    entityName: role.displayName,
  });

  return role;
}

/** Delete a non-system role */
export async function deleteRole(roleId: string, actor: Actor) {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw new Error("Role not found");
  if (role.isSystem) throw new Error("Cannot delete system roles");

  await prisma.role.delete({ where: { id: roleId } });

  await createAuditEvent({
    actorId: actor.id,
    actorName: actor.name,
    action: "role.deleted",
    entityType: "Role",
    entityId: role.id,
    entityName: role.displayName,
  });
}

/** Assign a permission to a role */
export async function assignPermission(
  roleId: string,
  permissionId: string,
  scopeType: string,
  actor: Actor,
) {
  const rp = await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId, permissionId } },
    update: { scopeType: scopeType as "ALL" | "BRANCH" | "OWN" | "TEAM" | "ASSIGNED" | "READ_ONLY" },
    create: {
      roleId,
      permissionId,
      scopeType: scopeType as "ALL" | "BRANCH" | "OWN" | "TEAM" | "ASSIGNED" | "READ_ONLY",
    },
    include: { permission: true, role: true },
  });

  await logSecurityEvent({
    type: "PERMISSION_CHANGE",
    actorId: actor.id,
    details: { roleId, roleName: rp.role.name, permissionCode: rp.permission.code, scopeType } as Record<string, unknown>,
    success: true,
  });

  return rp;
}

/** Remove a permission from a role */
export async function removePermission(roleId: string, permissionId: string, actor: Actor) {
  const rp = await prisma.rolePermission.delete({
    where: { roleId_permissionId: { roleId, permissionId } },
    include: { permission: true, role: true },
  });

  await logSecurityEvent({
    type: "PERMISSION_CHANGE",
    actorId: actor.id,
    details: { roleId, roleName: rp.role.name, permissionCode: rp.permission.code, action: "removed" } as Record<string, unknown>,
    success: true,
  });

  return rp;
}

/** List all roles with permission counts */
export async function listRoles() {
  return prisma.role.findMany({
    include: { _count: { select: { permissions: true, userAssignments: true } } },
    orderBy: { sortOrder: "asc" },
  });
}

/** Get role by ID with full permissions */
export async function getRoleById(roleId: string) {
  return prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: { include: { permission: true } },
      userAssignments: { where: { revokedAt: null }, include: { user: true } },
    },
  });
}

/** List all permissions grouped by module */
export async function listPermissions() {
  return prisma.permission.findMany({ orderBy: [{ module: "asc" }, { code: "asc" }] });
}
