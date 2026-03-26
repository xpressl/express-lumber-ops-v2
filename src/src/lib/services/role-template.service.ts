import { prisma } from "@/lib/prisma";
import type { RoleTemplateStatus, TaskRiskLevel } from "@prisma/client";

/** List role templates with filters and pagination */
export async function listRoleTemplates(filters?: {
  orgUnitId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}, scopeFilter?: Record<string, unknown>) {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...scopeFilter,
    ...(filters?.orgUnitId ? { orgUnitId: filters.orgUnitId } : {}),
    ...(filters?.status ? { status: filters.status as RoleTemplateStatus } : {}),
    ...(filters?.search
      ? { title: { contains: filters.search, mode: "insensitive" as const } }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.roleTemplate.findMany({
      where,
      include: {
        orgUnit: { select: { id: true, name: true, code: true, type: true } },
        requiredSkills: { include: { skill: true } },
        _count: { select: { taskAssignments: true, coverageGaps: true } },
      },
      skip,
      take: limit,
      orderBy: { title: "asc" },
    }),
    prisma.roleTemplate.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/** Get a single role template with all related data */
export async function getRoleTemplateDetail(id: string, scopeFilter?: Record<string, unknown>) {
  return prisma.roleTemplate.findFirst({
    where: { id, deletedAt: null, ...scopeFilter },
    include: {
      orgUnit: { select: { id: true, name: true, code: true, type: true } },
      requiredSkills: { include: { skill: true } },
      taskAssignments: {
        include: {
          task: true,
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      coverageGaps: true,
      hiringRequests: true,
      permissionReqs: true,
    },
  });
}

/** Create a new role template */
export async function createRoleTemplate(
  data: {
    title: string;
    orgUnitId?: string;
    summary?: string;
    mission?: string;
    criticality?: string;
    targetHeadcount?: number;
    status?: string;
  },
  createdBy: string,
) {
  return prisma.roleTemplate.create({
    data: {
      title: data.title,
      orgUnitId: data.orgUnitId,
      summary: data.summary,
      mission: data.mission,
      criticality: data.criticality ? (data.criticality as TaskRiskLevel) : undefined,
      targetHeadcount: data.targetHeadcount,
      status: data.status ? (data.status as RoleTemplateStatus) : undefined,
      createdBy,
    },
    include: {
      orgUnit: { select: { id: true, name: true, code: true, type: true } },
      requiredSkills: { include: { skill: true } },
    },
  });
}

/** Update an existing role template */
export async function updateRoleTemplate(
  id: string,
  data: Partial<{
    title: string;
    orgUnitId: string;
    summary: string;
    mission: string;
    criticality: string;
    targetHeadcount: number;
    status: string;
    backupExpectations: string;
  }>,
  scopeFilter?: Record<string, unknown>,
) {
  return prisma.roleTemplate.update({
    where: { id, deletedAt: null, ...scopeFilter },
    data: {
      ...data,
      criticality: data.criticality ? (data.criticality as TaskRiskLevel) : undefined,
      status: data.status ? (data.status as RoleTemplateStatus) : undefined,
    },
    include: {
      orgUnit: { select: { id: true, name: true, code: true, type: true } },
      requiredSkills: { include: { skill: true } },
    },
  });
}
