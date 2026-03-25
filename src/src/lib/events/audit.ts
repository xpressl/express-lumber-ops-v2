import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface CreateAuditEventInput {
  actorId: string | null;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  locationId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
}

/** Create an audit event (append-only) */
export async function createAuditEvent(input: CreateAuditEventInput) {
  return prisma.auditEvent.create({
    data: {
      actorId: input.actorId,
      actorName: input.actorName,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      entityName: input.entityName,
      locationId: input.locationId,
      before: (input.before as Prisma.InputJsonValue) ?? undefined,
      after: (input.after as Prisma.InputJsonValue) ?? undefined,
      metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
      source: input.source ?? "web",
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}

/** Get timeline of audit events for a specific entity */
export async function getEntityTimeline(entityType: string, entityId: string, limit = 50) {
  return prisma.auditEvent.findMany({
    where: { entityType, entityId },
    orderBy: { timestamp: "desc" },
    take: limit,
  });
}

/** Query audit events with filters */
export async function queryAuditEvents(filters: {
  actorId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  locationId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (filters.actorId) where["actorId"] = filters.actorId;
  if (filters.entityType) where["entityType"] = filters.entityType;
  if (filters.entityId) where["entityId"] = filters.entityId;
  if (filters.action) where["action"] = { contains: filters.action };
  if (filters.locationId) where["locationId"] = filters.locationId;
  if (filters.dateFrom || filters.dateTo) {
    where["timestamp"] = {
      ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
      ...(filters.dateTo ? { lte: filters.dateTo } : {}),
    };
  }

  const [data, total] = await Promise.all([
    prisma.auditEvent.findMany({ where, orderBy: { timestamp: "desc" }, skip, take: limit }),
    prisma.auditEvent.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
