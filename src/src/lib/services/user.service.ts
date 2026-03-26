import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { createAuditEvent } from "@/lib/events/audit";
import { logSecurityEvent } from "@/lib/events/security";
import { invalidatePermissionCache } from "@/lib/permissions/evaluate";
import type { Actor } from "@/lib/events/audit-helpers";

const USER_SORT_FIELDS = ["createdAt", "email", "firstName", "lastName", "status"] as const;

function validateSortField(field: string | undefined, allowed: readonly string[], defaultField: string): string {
  if (!field) return defaultField;
  return allowed.includes(field) ? field : defaultField;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  title?: string;
  department?: string;
  defaultLocationId?: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  title?: string;
  department?: string;
  defaultLocationId?: string;
}

/** Create a new user */
export async function createUser(input: CreateUserInput, actor: Actor) {
  const passwordHash = await hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      status: "ACTIVE",
      createdBy: actor.id,
      profile: {
        create: {
          title: input.title,
          department: input.department,
          defaultLocationId: input.defaultLocationId,
        },
      },
    },
    include: { profile: true },
  });

  await createAuditEvent({
    actorId: actor.id,
    actorName: actor.name,
    action: "user.created",
    entityType: "User",
    entityId: user.id,
    entityName: `${user.firstName} ${user.lastName}`,
    after: { email: user.email, firstName: user.firstName, lastName: user.lastName } as unknown as Record<string, unknown>,
  });

  return user;
}

/** Update user */
export async function updateUser(userId: string, input: UpdateUserInput, actor: Actor) {
  const before = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      status: input.status,
      profile: {
        update: {
          title: input.title,
          department: input.department,
          defaultLocationId: input.defaultLocationId,
        },
      },
    },
    include: { profile: true },
  });

  await createAuditEvent({
    actorId: actor.id,
    actorName: actor.name,
    action: "user.updated",
    entityType: "User",
    entityId: user.id,
    entityName: `${user.firstName} ${user.lastName}`,
    before: before ? sanitizeUserForAudit(before) : undefined,
    after: sanitizeUserForAudit(user),
  });

  return user;
}

/** Soft-delete user */
export async function deleteUser(userId: string, actor: Actor) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date(), status: "INACTIVE" },
  });

  await createAuditEvent({
    actorId: actor.id,
    actorName: actor.name,
    action: "user.deleted",
    entityType: "User",
    entityId: user.id,
    entityName: `${user.firstName} ${user.lastName}`,
  });

  return user;
}

/** Assign a role to a user */
export async function assignRole(
  userId: string,
  roleId: string,
  locationId: string | null,
  actor: Actor,
  reason?: string,
) {
  const assignment = await prisma.userRoleAssignment.create({
    data: {
      userId,
      roleId,
      locationId,
      assignedBy: actor.id,
      reason,
    },
    include: { role: true },
  });

  await invalidatePermissionCache(userId);

  await logSecurityEvent({
    type: "ROLE_CHANGE",
    actorId: actor.id,
    targetUserId: userId,
    details: { action: "assigned", roleId, roleName: assignment.role.name, locationId } as unknown as Record<string, unknown>,
    success: true,
  });

  await createAuditEvent({
    actorId: actor.id,
    actorName: actor.name,
    action: "role.assigned",
    entityType: "User",
    entityId: userId,
    metadata: { roleId, roleName: assignment.role.name, locationId } as unknown as Record<string, unknown>,
  });

  return assignment;
}

/** Revoke a role from a user */
export async function revokeRole(assignmentId: string, actor: Actor) {
  const assignment = await prisma.userRoleAssignment.update({
    where: { id: assignmentId },
    data: { revokedAt: new Date(), revokedBy: actor.id },
    include: { role: true },
  });

  await invalidatePermissionCache(assignment.userId);

  await logSecurityEvent({
    type: "ROLE_CHANGE",
    actorId: actor.id,
    targetUserId: assignment.userId,
    details: { action: "revoked", roleId: assignment.roleId, roleName: assignment.role.name } as unknown as Record<string, unknown>,
    success: true,
  });

  return assignment;
}

/** List users with pagination and filters */
export async function listUsers(params: {
  search?: string;
  status?: string;
  roleId?: string;
  locationId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(params.search
      ? {
          OR: [
            { firstName: { contains: params.search, mode: "insensitive" as const } },
            { lastName: { contains: params.search, mode: "insensitive" as const } },
            { email: { contains: params.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(params.status ? { status: params.status as "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING" } : {}),
    ...(params.roleId
      ? { roleAssignments: { some: { roleId: params.roleId, revokedAt: null } } }
      : {}),
    ...(params.locationId
      ? { roleAssignments: { some: { locationId: params.locationId, revokedAt: null } } }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        profile: true,
        roleAssignments: {
          where: { revokedAt: null },
          include: { role: true, location: true },
        },
      },
      skip,
      take: limit,
      orderBy: { [validateSortField(params.sortBy, USER_SORT_FIELDS, "createdAt")]: params.sortOrder ?? "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/** Strip sensitive fields from user object before storing in audit log */
function sanitizeUserForAudit(user: Record<string, unknown>): Record<string, unknown> {
  const { passwordHash, ...safe } = user as Record<string, unknown> & { passwordHash?: unknown };
  return safe;
}

/** Get user by ID with full details */
export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      roleAssignments: {
        where: { revokedAt: null },
        include: { role: { include: { permissions: { include: { permission: true } } } }, location: true },
      },
    },
  });
}
