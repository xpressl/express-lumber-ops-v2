import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/events/audit";
import { createException } from "@/lib/exceptions/engine";
import type { Actor } from "@/lib/events/audit-helpers";
import type { ImportType, ImportStatus } from "@prisma/client";

/** Create an import job */
export async function createImportJob(input: {
  type: ImportType; fileName: string; fileUrl: string; locationId: string;
}, actor: Actor) {
  const job = await prisma.importJob.create({
    data: { ...input, status: "UPLOADING", createdBy: actor.id },
  });

  await createAuditEvent({
    actorId: actor.id, actorName: actor.name, action: "import.created",
    entityType: "ImportJob", entityId: job.id, entityName: input.fileName,
    locationId: input.locationId,
  });

  return job;
}

/** Update import job status */
export async function updateImportStatus(jobId: string, status: ImportStatus, stats?: {
  totalRows?: number; processedRows?: number; createdRows?: number;
  updatedRows?: number; unchangedRows?: number; errorRows?: number;
  confidenceScore?: number; errors?: Prisma.InputJsonValue;
}) {
  return prisma.importJob.update({
    where: { id: jobId },
    data: { status, ...stats, confidenceScore: stats?.confidenceScore },
  });
}

/** Approve an import */
export async function approveImport(jobId: string, actor: Actor) {
  const existing = await prisma.importJob.findUnique({ where: { id: jobId } });
  if (!existing) throw new Error("Import job not found");
  if (existing.status !== "REVIEWING") throw new Error(`Cannot approve import in status: ${existing.status}`);

  const job = await prisma.importJob.update({
    where: { id: jobId },
    data: { status: "APPROVED", reviewedBy: actor.id, reviewedAt: new Date() },
  });

  await createAuditEvent({
    actorId: actor.id, actorName: actor.name, action: "import.approved",
    entityType: "ImportJob", entityId: jobId,
    locationId: job.locationId,
  });

  return job;
}

/** Reject an import */
export async function rejectImport(jobId: string, actor: Actor) {
  const existing = await prisma.importJob.findUnique({ where: { id: jobId } });
  if (!existing) throw new Error("Import job not found");
  if (existing.status !== "REVIEWING") throw new Error(`Cannot reject import in status: ${existing.status}`);

  const job = await prisma.importJob.update({
    where: { id: jobId },
    data: { status: "REJECTED", reviewedBy: actor.id, reviewedAt: new Date() },
  });

  await createAuditEvent({
    actorId: actor.id, actorName: actor.name, action: "import.rejected",
    entityType: "ImportJob", entityId: jobId,
    locationId: job.locationId,
  });

  return job;
}

/** List import jobs */
export async function listImports(params: { type?: string; status?: string; locationId?: string; scopeFilter?: Record<string, unknown> }) {
  return prisma.importJob.findMany({
    where: {
      ...params.scopeFilter,
      ...(params.type ? { type: params.type as ImportType } : {}),
      ...(params.status ? { status: params.status as ImportStatus } : {}),
      ...(params.locationId ? { locationId: params.locationId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

/** Get import detail with changes */
export async function getImportById(jobId: string, _scopeFilter?: Record<string, unknown>) {
  return prisma.importJob.findUnique({
    where: { id: jobId },
    include: { changes: { orderBy: { rowNumber: "asc" }, take: 100 } },
  });
}

/** Calculate confidence score for import */
export function calculateConfidence(totalRows: number, errorRows: number, matchedRows: number): number {
  if (totalRows === 0) return 0;
  const errorRate = errorRows / totalRows;
  const matchRate = matchedRows / totalRows;
  return Math.round((1 - errorRate) * matchRate * 100) / 100;
}
