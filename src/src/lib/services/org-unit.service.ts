import { prisma } from "@/lib/prisma";
import type { OrgUnitType, OrgUnitStatus } from "@prisma/client";

/** Nested include for 5-level org tree (COMPANY > REGION > BRANCH > DEPARTMENT > TEAM) */
const headSelect = { select: { id: true, firstName: true, lastName: true } } as const;
const locationSelect = { select: { id: true, name: true, code: true } } as const;
const countSelect = { select: { roleTemplates: true, coverageGaps: true, hiringRequests: true } } as const;

const childInclude = {
  head: headSelect,
  location: locationSelect,
  _count: countSelect,
} as const;

const unitInclude = {
  head: headSelect,
  location: locationSelect,
  _count: countSelect,
  children: {
    where: { deletedAt: null },
    include: {
      ...childInclude,
      children: {
        where: { deletedAt: null },
        include: {
          ...childInclude,
          children: {
            where: { deletedAt: null },
            include: {
              ...childInclude,
              children: {
                where: { deletedAt: null },
                include: childInclude,
              },
            },
          },
        },
      },
    },
  },
} as const;

/** Fetch the full org tree starting from root units */
export async function getOrgTree(filters?: {
  type?: string;
  locationId?: string;
  status?: string;
}, scopeFilter?: Record<string, unknown>) {
  return prisma.organizationUnit.findMany({
    where: {
      parentId: null,
      deletedAt: null,
      ...scopeFilter,
      ...(filters?.type ? { type: filters.type as OrgUnitType } : {}),
      ...(filters?.locationId ? { locationId: filters.locationId } : {}),
      ...(filters?.status
        ? { status: filters.status as OrgUnitStatus }
        : { status: "ACTIVE" }),
    },
    include: unitInclude,
    orderBy: { sortOrder: "asc" },
  });
}

/** Aggregate stats for the org map dashboard */
export async function getOrgStats(scopeFilter?: Record<string, unknown>) {
  const [totalUnits, activeRoles, coverageGaps, hiringRequests] =
    await Promise.all([
      prisma.organizationUnit.count({
        where: { deletedAt: null, status: "ACTIVE", ...scopeFilter },
      }),
      prisma.roleTemplate.count({
        where: { deletedAt: null, status: "ACTIVE" },
      }),
      prisma.coverageGap.count({
        where: { status: "OPEN" },
      }),
      prisma.hiringRequest.count({
        where: { status: { notIn: ["FILLED", "CANCELLED"] } },
      }),
    ]);

  return { totalUnits, activeRoles, coverageGaps, hiringRequests };
}

/** Get a single org unit with full related data */
export async function getUnitDetail(unitId: string, scopeFilter?: Record<string, unknown>) {
  return prisma.organizationUnit.findFirst({
    where: { id: unitId, deletedAt: null, ...scopeFilter },
    include: {
      head: headSelect,
      location: locationSelect,
      parent: { include: { head: headSelect } },
      children: {
        where: { deletedAt: null },
        include: { head: headSelect },
        orderBy: { sortOrder: "asc" },
      },
      roleTemplates: {
        where: { deletedAt: null },
        include: { requiredSkills: { include: { skill: true } } },
      },
      coverageGaps: {
        where: { status: { not: "RESOLVED" } },
      },
      hiringRequests: {
        where: { status: { notIn: ["FILLED", "CANCELLED"] } },
      },
    },
  });
}

/** Create a new organization unit */
export async function createOrgUnit(
  data: {
    parentId?: string;
    type: string;
    name: string;
    code: string;
    description?: string;
    headId?: string;
    locationId?: string;
  },
  createdBy: string,
) {
  return prisma.organizationUnit.create({
    data: {
      parentId: data.parentId,
      type: data.type as OrgUnitType,
      name: data.name,
      code: data.code,
      description: data.description,
      headId: data.headId,
      locationId: data.locationId,
      createdBy,
    },
    include: {
      head: headSelect,
      location: locationSelect,
      parent: true,
    },
  });
}

/** Update an existing organization unit */
export async function updateOrgUnit(
  id: string,
  data: Partial<{
    parentId: string;
    type: string;
    name: string;
    code: string;
    description: string;
    headId: string;
    locationId: string;
    status: string;
    sortOrder: number;
  }>,
  scopeFilter?: Record<string, unknown>,
) {
  // Validate parentId to prevent circular references
  if (data.parentId) {
    if (data.parentId === id) throw new Error("Cannot set parent to self");
    let current = data.parentId;
    const visited = new Set<string>();
    while (current) {
      if (current === id) throw new Error("Cannot create circular reference in org tree");
      if (visited.has(current)) break;
      visited.add(current);
      const parent = await prisma.organizationUnit.findUnique({ where: { id: current }, select: { parentId: true } });
      current = parent?.parentId ?? "";
      if (!current) break;
    }
  }

  return prisma.organizationUnit.update({
    where: { id, deletedAt: null, ...scopeFilter },
    data: {
      ...data,
      type: data.type ? (data.type as OrgUnitType) : undefined,
      status: data.status ? (data.status as OrgUnitStatus) : undefined,
    },
    include: {
      head: headSelect,
      location: locationSelect,
      parent: true,
    },
  });
}
