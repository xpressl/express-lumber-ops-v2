import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/events/audit";
import { emitToRoom } from "@/lib/socket";
import type { ExceptionSeverity } from "@prisma/client";

/** Exception category definitions with default SLAs */
export const EXCEPTION_CATEGORIES = {
  LATE_ORDER: { severity: "HIGH" as const, slaHours: 2, module: "dispatch" },
  ROUTE_OVERLOAD: { severity: "MEDIUM" as const, slaHours: 4, module: "dispatch" },
  DELIVERY_FAILURE: { severity: "HIGH" as const, slaHours: 2, module: "delivery" },
  MISSING_POD: { severity: "MEDIUM" as const, slaHours: 4, module: "delivery" },
  COD_SHORT: { severity: "HIGH" as const, slaHours: 2, module: "delivery" },
  BACKORDER_RISK: { severity: "MEDIUM" as const, slaHours: 8, module: "orders" },
  RECEIVING_DISCREPANCY: { severity: "HIGH" as const, slaHours: 4, module: "receiving" },
  INVOICE_MISMATCH: { severity: "HIGH" as const, slaHours: 8, module: "purchasing" },
  PRICE_MARGIN_RISK: { severity: "MEDIUM" as const, slaHours: 24, module: "pricing" },
  PROMISE_DUE_TODAY: { severity: "MEDIUM" as const, slaHours: 8, module: "collections" },
  DISPUTE_OVERDUE: { severity: "HIGH" as const, slaHours: 4, module: "collections" },
  HOLD_WITH_URGENT_ORDER: { severity: "CRITICAL" as const, slaHours: 1, module: "credit" },
  UNAUTHORIZED_ACCESS: { severity: "CRITICAL" as const, slaHours: 1, module: "security" },
  APPROVAL_OVERDUE: { severity: "MEDIUM" as const, slaHours: 4, module: "approvals" },
  IMPORT_BLOCKED: { severity: "HIGH" as const, slaHours: 4, module: "imports" },
  CYCLE_COUNT_VARIANCE: { severity: "MEDIUM" as const, slaHours: 8, module: "yard" },
} as const;

export type ExceptionCategory = keyof typeof EXCEPTION_CATEGORIES;

export interface CreateExceptionInput {
  category: ExceptionCategory;
  title: string;
  description?: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  locationId: string;
  ownerId?: string;
  severity?: ExceptionSeverity;
}

/** Create a new exception */
export async function createException(input: CreateExceptionInput) {
  const categoryDef = EXCEPTION_CATEGORIES[input.category];
  const severity = input.severity ?? categoryDef.severity;
  const slaTargetAt = new Date(Date.now() + categoryDef.slaHours * 60 * 60 * 1000);
  const priorityScore = calculatePriorityScore(severity, slaTargetAt);

  const exception = await prisma.exception.create({
    data: {
      category: input.category,
      severity,
      title: input.title,
      description: input.description,
      entityType: input.entityType,
      entityId: input.entityId,
      entityName: input.entityName,
      module: categoryDef.module,
      ownerId: input.ownerId,
      locationId: input.locationId,
      status: "OPEN",
      slaTargetAt,
      priorityScore,
    },
  });

  // Emit real-time event
  emitToRoom(`command-center:${input.locationId}`, "exception:created", {
    exceptionId: exception.id,
    category: input.category,
    severity,
    title: input.title,
    locationId: input.locationId,
  });

  await createAuditEvent({
    actorId: null,
    actorName: "System",
    action: "exception.created",
    entityType: input.entityType,
    entityId: input.entityId,
    entityName: input.entityName,
    locationId: input.locationId,
    metadata: { exceptionId: exception.id, category: input.category, severity },
  });

  return exception;
}

/** Acknowledge an exception */
export async function acknowledgeException(exceptionId: string, userId: string) {
  return prisma.exception.update({
    where: { id: exceptionId },
    data: { status: "ACKNOWLEDGED", ownerId: userId },
  });
}

/** Start working on an exception */
export async function startException(exceptionId: string, userId: string) {
  return prisma.exception.update({
    where: { id: exceptionId },
    data: { status: "IN_PROGRESS", ownerId: userId },
  });
}

/** Resolve an exception */
export async function resolveException(exceptionId: string, userId: string, note: string) {
  const exception = await prisma.exception.update({
    where: { id: exceptionId },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
      resolvedBy: userId,
      resolutionNote: note,
    },
  });

  emitToRoom(`command-center:${exception.locationId}`, "exception:resolved", {
    exceptionId: exception.id,
    locationId: exception.locationId,
  });

  return exception;
}

/** Escalate an exception */
export async function escalateException(exceptionId: string, escalatedToUserId: string) {
  return prisma.exception.update({
    where: { id: exceptionId },
    data: {
      status: "ESCALATED",
      escalatedAt: new Date(),
      escalatedTo: escalatedToUserId,
      severity: "CRITICAL",
    },
  });
}

/** Dismiss an exception */
export async function dismissException(exceptionId: string, userId: string, reason: string) {
  return prisma.exception.update({
    where: { id: exceptionId },
    data: {
      status: "DISMISSED",
      resolvedAt: new Date(),
      resolvedBy: userId,
      resolutionNote: reason,
    },
  });
}

/** Get exception summary counts for dashboard */
export async function getExceptionSummary(locationId?: string) {
  const where = {
    status: { in: ["OPEN" as const, "ACKNOWLEDGED" as const, "IN_PROGRESS" as const, "ESCALATED" as const] },
    ...(locationId ? { locationId } : {}),
  };

  const [total, bySeverity, byCategory] = await Promise.all([
    prisma.exception.count({ where }),
    prisma.exception.groupBy({ by: ["severity"], _count: true, where }),
    prisma.exception.groupBy({ by: ["category"], _count: true, where }),
  ]);

  return {
    total,
    bySeverity: Object.fromEntries(bySeverity.map((s) => [s.severity, s._count])),
    byCategory: Object.fromEntries(byCategory.map((c) => [c.category, c._count])),
  };
}

/** Calculate priority score */
function calculatePriorityScore(severity: ExceptionSeverity, slaTargetAt: Date): number {
  const severityWeights = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const severityScore = (severityWeights[severity] ?? 1) * 40;
  const now = Date.now();
  const slaMs = slaTargetAt.getTime() - now;
  const totalSlaMs = slaTargetAt.getTime() - now;
  const slaUrgency = totalSlaMs > 0 ? Math.max(0, 1 - slaMs / totalSlaMs) : 1;
  const slaScore = slaUrgency * 30;
  return Math.round(severityScore + slaScore);
}
