import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/events/audit";
import type { Actor } from "@/lib/events/audit-helpers";
import type { LeadStatus, EstimateStatus } from "@prisma/client";

/** List leads with filters */
export async function listLeads(params: {
  status?: string; assignedTo?: string; locationId?: string; search?: string;
  page?: number; limit?: number;
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const skip = (page - 1) * limit;

  const where: Prisma.LeadWhereInput = {
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
  };

  const [data, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/** Create lead */
export async function createLead(input: {
  companyName: string; contactName: string; email?: string; phone?: string;
  source?: string; notes?: string; locationId: string;
}, actor: Actor) {
  const lead = await prisma.lead.create({
    data: { ...input, createdBy: actor.id },
  });
  await createAuditEvent({
    actorId: actor.id, actorName: actor.name, action: "crm.lead_created",
    entityType: "Lead", entityId: lead.id, entityName: lead.companyName,
    locationId: input.locationId,
  });
  return lead;
}

/** Update lead status */
export async function updateLead(leadId: string, input: {
  status?: LeadStatus; assignedTo?: string; notes?: string; lostReason?: string;
}, actor: Actor) {
  const lead = await prisma.lead.update({ where: { id: leadId }, data: input });

  await createAuditEvent({
    actorId: actor.id, actorName: actor.name, action: "crm.lead_updated",
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
}, actor: Actor) {
  const estimateNumber = await generateEstimateNumber();
  const totalAmount = input.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  // Look up product costs for lines that reference a product
  const productIds = input.lines.map((l) => l.productId).filter(Boolean) as string[];
  const products = productIds.length > 0
    ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, currentCost: true } })
    : [];
  const productCostMap = new Map(products.map((p) => [p.id, Number(p.currentCost)]));

  const estimate = await prisma.estimate.create({
    data: {
      estimateNumber,
      customerId: input.customerId,
      leadId: input.leadId,
      salesRepId: actor.id,
      jobName: input.jobName,
      jobAddress: input.jobAddress,
      status: "DRAFT",
      totalAmount,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      notes: input.notes,
      locationId: input.locationId,
      createdBy: actor.id,
      lines: {
        create: input.lines.map((l) => ({
          productId: l.productId,
          description: l.description,
          quantity: l.quantity,
          uom: l.uom,
          unitPrice: l.unitPrice,
          unitCost: l.productId ? productCostMap.get(l.productId) ?? 0 : 0,
          extendedPrice: l.quantity * l.unitPrice,
        })),
      },
    },
    include: { lines: true },
  });

  await createAuditEvent({
    actorId: actor.id, actorName: actor.name, action: "crm.estimate_created",
    entityType: "Estimate", entityId: estimate.id, entityName: estimateNumber,
    locationId: input.locationId,
  });

  return estimate;
}

/** List estimates */
export async function listEstimates(params: {
  status?: string; salesRepId?: string; locationId?: string;
  scopeFilter?: Record<string, unknown>;
}) {
  return prisma.estimate.findMany({
    where: {
      deletedAt: null,
      ...params.scopeFilter,
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
    where: { id: estimateId, deletedAt: null },
    include: { lines: { orderBy: { description: "asc" } } },
  });
}

/** Get follow-up queue */
export async function getFollowUpQueue(salesRepId?: string, locationId?: string, scopeFilter?: Record<string, unknown>) {
  return prisma.estimate.findMany({
    where: {
      deletedAt: null,
      ...scopeFilter,
      status: { in: ["SENT", "VIEWED", "FOLLOW_UP"] },
      followUpDate: { lte: new Date() },
      ...(salesRepId ? { salesRepId } : {}),
      ...(locationId ? { locationId } : {}),
    },
    orderBy: { followUpDate: "asc" },
  });
}

/** Get dormant accounts */
export async function getDormantAccounts(locationId?: string, scopeFilter?: Record<string, unknown>, daysSinceOrder = 90) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysSinceOrder);

  return prisma.customer.findMany({
    where: {
      deletedAt: null,
      ...scopeFilter,
      status: "ACTIVE",
      ...(locationId ? { locationId } : {}),
      orders: { none: { createdAt: { gte: cutoff } } },
    },
    include: { _count: { select: { orders: true } } },
    orderBy: { companyName: "asc" },
    take: 50,
  });
}

/** Generate sequential estimate number using serializable transaction to prevent duplicates */
async function generateEstimateNumber(): Promise<string> {
  const today = new Date();
  const prefix = `EST-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}`;

  return await prisma.$transaction(async (tx) => {
    const result = await tx.$queryRaw<[{ max_num: string | null }]>`
      SELECT MAX(CAST(SPLIT_PART("estimateNumber", '-', 3) AS INTEGER)) as max_num
      FROM "Estimate"
      WHERE "estimateNumber" LIKE ${prefix + '-%'}
      FOR UPDATE
    `;
    const nextNum = (result[0]?.max_num ? parseInt(result[0].max_num, 10) || 0 : 0) + 1;
    return `${prefix}-${String(nextNum).padStart(4, "0")}`;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
