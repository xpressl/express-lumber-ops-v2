import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SecurityEventType } from "@prisma/client";

export interface CreateSecurityEventInput {
  type: SecurityEventType;
  actorId?: string;
  targetUserId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
}

/** Log a security event */
export async function logSecurityEvent(input: CreateSecurityEventInput) {
  return prisma.securityEvent.create({
    data: {
      type: input.type,
      actorId: input.actorId,
      targetUserId: input.targetUserId,
      details: (input.details as Prisma.InputJsonValue) ?? undefined,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      success: input.success,
    },
  });
}

/** Query security events with filters */
export async function querySecurityEvents(filters: {
  type?: SecurityEventType;
  actorId?: string;
  targetUserId?: string;
  success?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (filters.type) where["type"] = filters.type;
  if (filters.actorId) where["actorId"] = filters.actorId;
  if (filters.targetUserId) where["targetUserId"] = filters.targetUserId;
  if (filters.success !== undefined) where["success"] = filters.success;
  if (filters.dateFrom || filters.dateTo) {
    where["timestamp"] = {
      ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
      ...(filters.dateTo ? { lte: filters.dateTo } : {}),
    };
  }

  const [data, total] = await Promise.all([
    prisma.securityEvent.findMany({ where, orderBy: { timestamp: "desc" }, skip, take: limit }),
    prisma.securityEvent.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
