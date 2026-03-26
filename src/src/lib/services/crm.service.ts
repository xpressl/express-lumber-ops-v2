import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/events/audit";
import type { LeadStatus, EstimateStatus } from "@prisma/client";

/** List leads with filters */
export async function listLeads(params: {
  status?: string; assignedTo?: string; locationId?: string; search?: string;
}) {
  return prisma.lead.findMany({
    where: {
      deletedAt: null,
      ...(params.status ? { status: params.status as LeadStatus } : {}),
      ...(params.assignedTo ? { assignedTo: params.assignedTo } : {}),
      ...(params.locationId ? { locationId: params.locationId } : {}),
      ...(params.search ? {
        OR: [
          { companyName: { contains: params.search, mode: "insensitive" as const } },
          { contactName: { contains: params.search, mode: "insensitive" as const } },
        ],
      } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Create lead */
export async function createLead(input: {
  companyName: string; contactName: string; email?: string; phone?: string;
  source?: string; notes?: string; locationId: string;
}, actorId: string) {
  const lead = await prisma.lead.create({
    data: { ...input, createdBy: actorId },
  });
  await createAuditEvent({
    actorId, actorName: "System", action: "crm.lead_created",
    entityType: "Lead", entityId: lead.id, entityName: lead.companyName,
    locationId: input.locationId,
  });
  return lead;
}

/** Update lead status */
export async function updateLead(leadId: string, input: {
  status?: LeadStatus; assignedTo?: string; notes?: string; lostReason?: string;
}, actorId: string) {
  const lead = await prisma.lead.update({ where: { id: leadId }, data: input });

  await createAuditEvent({
    actorId, actorName: actorId, action: "crm.lead_updated",
    entityType: "Lead", entityId: lead.id, entityName: lead.companyName,
    metadata: { status: input.status, assignedTo: input.assignedTo } as Record<string, unknown>,
  });

  return lead;
}

/** Create estimate */
export async function createEstimate(input: {
  customerId?: string; leadId?: string; jobName?: string; jobAddress?: string;
  expiresAt?: string; notes?: string; locationId: string;
  lines: Array<{ productId?: string; description: string; quantity: number; uom: string; unitPrice: number }>;
}, actorId: string) {
  const estimateNumber = await generateEstimateNumber();
  const totalAmount = input.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  const estimate = await prisma.estimate.create({
    data: {
      estimateNumber,
      customerId: input.customerId,
      leadId: input.leadId,
      salesRepId: actorId,
      jobName: input.jobName,
      jobAddress: input.jobAddress,
      status: "DRAFT",
      totalAmount,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      notes: input.notes,
      locationId: input.locationId,
      createdBy: actorId,
      lines: {
        create: input.lines.map((l) => ({
          productId: l.productId,
          description: l.description,
          quantity: l.quantity,
          uom: l.uom,
          unitPrice: l.unitPrice,
          unitCost: 0, // TODO: lookup from product
          extendedPrice: l.quantity * l.unitPrice,
        })),
      },
    },
    include: { lines: true },
  });

  await createAuditEvent({
    actorId, actorName: "System", action: "crm.estimate_created",
    entityType: "Estimate", entityId: estimate.id, entityName: estimateNumber,
    locationId: input.locationId,
  });

  return estimate;
}

/** List estimates */
export async function listEstimates(params: {
  status?: string; salesRepId?: string; locationId?: string;
}) {
  return prisma.estimate.findMany({
    where: {
      deletedAt: null,
      ...(params.status ? { status: params.status as EstimateStatus } : {}),
      ...(params.salesRepId ? { salesRepId: params.salesRepId } : {}),
      ...(params.locationId ? { locationId: params.locationId } : {}),
    },
    include: { _count: { select: { lines: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/** Get estimate detail */
export async function getEstimateById(estimateId: string) {
  return prisma.estimate.findUnique({
    where: { id: estimateId },
    include: { lines: { orderBy: { description: "asc" } } },
  });
}

/** Get follow-up queue */
export async function getFollowUpQueue(salesRepId?: string, locationId?: string) {
  return prisma.estimate.findMany({
    where: {
      deletedAt: null,
      status: { in: ["SENT", "VIEWED", "FOLLOW_UP"] },
      followUpDate: { lte: new Date() },
      ...(salesRepId ? { salesRepId } : {}),
      ...(locationId ? { locationId } : {}),
    },
    orderBy: { followUpDate: "asc" },
  });
}

/** Get dormant accounts */
export async function getDormantAccounts(locationId?: string, daysSinceOrder = 90) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysSinceOrder);

  return prisma.customer.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      ...(locationId ? { locationId } : {}),
      orders: { none: { createdAt: { gte: cutoff } } },
    },
    include: { _count: { select: { orders: true } } },
    orderBy: { companyName: "asc" },
    take: 50,
  });
}

async function generateEstimateNumber(): Promise<string> {
  const today = new Date();
  const prefix = `EST-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}`;
  const count = await prisma.estimate.count({ where: { estimateNumber: { startsWith: prefix } } });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}
