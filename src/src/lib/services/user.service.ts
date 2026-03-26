import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { createAuditEvent } from "@/lib/events/audit";
import { logSecurityEvent } from "@/lib/events/security";
import { invalidatePermissionCache } from "@/lib/permissions/evaluate";

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
export async function createUser(input: CreateUserInput, actorId: string) {
  const passwordHash = await hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      status: "ACTIVE",
      createdBy: actorId,
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
    actorId,
    actorName: "System",
    action: "user.created",
    entityType: "User",
    entityId: user.id,
    entityName: `${user.firstName} ${user.lastName}`,
    after: { email: user.email, firstName: user.firstName, lastName: user.lastName } as unknown as Record<string, unknown>,
  });

  return user;
}

/** Update user */
export async function updateUser(userId: string, input: UpdateUserInput, actorId: string) {
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
    actorId,
    actorName: "System",
    action: "user.updated",
    entityType: "User",
    entityId: user.id,
    entityName: `${user.firstName} ${user.lastName}`,
    before: before as unknown as Record<string, unknown>,
    after: user as unknown as Record<string, unknown>,
  });

  return user;
}

/** Soft-delete user */
export async function deleteUser(userId: string, actorId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date(), status: "INACTIVE" },
  });

  await createAuditEvent({
    actorId,
    actorName: "System",
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
  actorId: string,
  reason?: string,
) {
  const assignment = await prisma.userRoleAssignment.create({
    data: {
      userId,
      roleId,
      locationId,
      assignedBy: actorId,
      reason,
    },
    include: { role: true },
  });

  await invalidatePermissionCache(userId);

  await logSecurityEvent({
    type: "ROLE_CHANGE",
    actorId,
    targetUserId: userId,
    details: { action: "assigned", roleId, roleName: assignment.role.name, locationId } as unknown as Record<string, unknown>,
    success: true,
  });

  await createAuditEvent({
    actorId,
    actorName: "System",
    action: "role.assigned",
    entityType: "User",
    entityId: userId,
    metadata: { roleId, roleName: assignment.role.name, locationId } as unknown as Record<string, unknown>,
  });

  return assignment;
}

/** Revoke a role from a user */
export async function revokeRole(assignmentId: string, actorId: string) {
  const assignment = await prisma.userRoleAssignment.update({
    where: { id: assignmentId },
    data: { revokedAt: new Date(), revokedBy: actorId },
    include: { role: true },
  });

  await invalidatePermissionCache(assignment.userId);

  await logSecurityEvent({
    type: "ROLE_CHANGE",
    actorId,
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
      orderBy: { [params.sortBy ?? "createdAt"]: params.sortOrder ?? "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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
