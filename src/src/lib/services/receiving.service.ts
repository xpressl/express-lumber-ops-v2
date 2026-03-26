import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/events/audit";
import { createException } from "@/lib/exceptions/engine";
import type { Actor } from "@/lib/events/audit-helpers";
import type { ReceivingLineStatus } from "@prisma/client";

/** Start receiving against a PO */
export async function startReceiving(purchaseOrderId: string, locationId: string, actor: Actor) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { lines: true },
  });
  if (!po) throw new Error("PO not found");

  const record = await prisma.receivingRecord.create({
    data: {
      purchaseOrderId,
      receivedBy: actor.id,
      status: "IN_PROGRESS",
      totalLinesExpected: po.lines.length,
      locationId,
    },
  });

  // Pre-create receiving lines from PO lines
  for (const line of po.lines) {
    await prisma.receivingLine.create({
      data: {
        receivingRecordId: record.id,
        productId: line.productId,
        lineNumber: line.lineNumber,
        expectedQty: line.quantity,
        receivedQty: 0,
        status: "PENDING",
      },
    });
  }

  await createAuditEvent({
    actorId: actor.id, actorName: actor.name, action: "receiving.started",
    entityType: "ReceivingRecord", entityId: record.id,
    locationId, metadata: { poNumber: po.poNumber } as Record<string, unknown>,
  });

  return record;
}

/** Receive a line item */
export async function receiveLine(
  receivingRecordId: string,
  lineId: string,
  input: { receivedQty: number; status: ReceivingLineStatus; damageNotes?: string; photos?: string[]; notes?: string },
  actor: Actor,
) {
  const line = await prisma.receivingLine.update({
    where: { id: lineId },
    data: {
      receivedQty: input.receivedQty,
      status: input.status,
      damageNotes: input.damageNotes,
      photos: input.photos ?? [],
      notes: input.notes,
    },
  });

  // Update record stats
  const allLines = await prisma.receivingLine.findMany({ where: { receivingRecordId } });
  const receivedCount = allLines.filter((l) => l.status !== "PENDING").length;
  const hasDiscrepancy = allLines.some((l) => ["SHORT", "OVER", "DAMAGED", "SUBSTITUTE", "REJECTED"].includes(l.status));

  await prisma.receivingRecord.update({
    where: { id: receivingRecordId },
    data: { totalLinesReceived: receivedCount, hasDiscrepancy },
  });

  // Create exception for discrepancies
  if (["SHORT", "OVER", "DAMAGED"].includes(input.status)) {
    const record = await prisma.receivingRecord.findUnique({ where: { id: receivingRecordId } });
    if (record) {
      await createException({
        category: "RECEIVING_DISCREPANCY",
        title: `Receiving discrepancy: ${input.status}`,
        description: input.damageNotes ?? `Line received as ${input.status}`,
        entityType: "ReceivingLine", entityId: lineId,
        locationId: record.locationId,
      });
    }
  }

  return line;
}

/** Complete receiving (mark as pending review) */
export async function completeReceiving(receivingRecordId: string, actor: Actor) {
  const needsReview = await recordNeedsReview(receivingRecordId);
  const record = await prisma.receivingRecord.update({
    where: { id: receivingRecordId },
    data: { status: needsReview ? "PENDING_REVIEW" : "APPROVED" },
  });

  await createAuditEvent({
    actorId: actor.id, actorName: actor.name, action: "receiving.completed",
    entityType: "ReceivingRecord", entityId: record.id,
    locationId: record.locationId,
  });

  return record;
}

/** List receiving records */
export async function listReceivingRecords(
  locationId: string,
  status?: string,
  page = 1,
  limit = 50,
) {
  const skip = (page - 1) * limit;

  const where = {
    locationId,
    deletedAt: null,
    ...(status ? { status: status as "IN_PROGRESS" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "AP_HOLD" } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.receivingRecord.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.receivingRecord.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/** Get receiving record by ID */
export async function getReceivingById(recordId: string, _scopeFilter?: Record<string, unknown>) {
  return prisma.receivingRecord.findUnique({
    where: { id: recordId },
    include: { lines: { orderBy: { lineNumber: "asc" } } },
  });
}

/** Get discrepancy queue */
export async function getDiscrepancies(locationId: string) {
  return prisma.receivingRecord.findMany({
    where: { locationId, hasDiscrepancy: true, status: { in: ["PENDING_REVIEW", "AP_HOLD"] } },
    include: {
      lines: { where: { status: { in: ["SHORT", "OVER", "DAMAGED", "SUBSTITUTE", "REJECTED"] } } },
    },
    orderBy: { receivedAt: "desc" },
  });
}

async function recordNeedsReview(recordId: string): Promise<boolean> {
  const lines = await prisma.receivingLine.findMany({ where: { receivingRecordId: recordId } });
  return lines.some((l) => l.status !== "RECEIVED");
}
