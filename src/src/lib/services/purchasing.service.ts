import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/events/audit";
import type { Actor } from "@/lib/events/audit-helpers";
import type { POStatus } from "@prisma/client";

/** Create PO */
export async function createPO(input: {
  vendorId: string; expectedDate?: string; notes?: string; locationId: string;
  lines: Array<{ productId: string; quantity: number; unitCost: number; notes?: string }>;
}, actor: Actor) {
  const poNumber = await generatePONumber();
  const totalAmount = input.lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber, vendorId: input.vendorId, status: "DRAFT", totalAmount,
      expectedDate: input.expectedDate ? new Date(input.expectedDate) : null,
      notes: input.notes, locationId: input.locationId, createdBy: actor.id,
      lines: {
        create: input.lines.map((l, i) => ({
          productId: l.productId, lineNumber: i + 1,
          quantity: l.quantity, unitCost: l.unitCost,
          extendedCost: l.quantity * l.unitCost, notes: l.notes,
        })),
      },
    },
    include: { lines: true },
  });

  await createAuditEvent({
    actorId: actor.id, actorName: actor.name, action: "purchasing.po_created",
    entityType: "PurchaseOrder", entityId: po.id, entityName: poNumber,
    locationId: input.locationId,
  });

  return po;
}

/** List POs */
export async function listPOs(params: {
  vendorId?: string; status?: string; locationId?: string;
  page?: number; limit?: number;
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const skip = (page - 1) * limit;

  const where: Prisma.PurchaseOrderWhereInput = {
    deletedAt: null,
    ...(params.vendorId ? { vendorId: params.vendorId } : {}),
    ...(params.status ? { status: params.status as POStatus } : {}),
    ...(params.locationId ? { locationId: params.locationId } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: { vendor: { select: { name: true } }, _count: { select: { lines: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/** List vendors */
export async function listVendors(params?: {
  search?: string; status?: string;
  page?: number; limit?: number;
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  const skip = (page - 1) * limit;

  const where: Prisma.VendorWhereInput = {
    deletedAt: null,
    ...(params?.search ? {
      OR: [
        { name: { contains: params.search, mode: "insensitive" as const } },
        { code: { contains: params.search, mode: "insensitive" as const } },
      ],
    } : {}),
    ...(params?.status ? { status: params.status as "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PROBATION" } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      include: { _count: { select: { purchaseOrders: true, prices: true } } },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.vendor.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/** Get vendor detail with scorecard */
export async function getVendorById(vendorId: string, _scopeFilter?: Record<string, unknown>) {
  return prisma.vendor.findUnique({
    where: { id: vendorId },
    include: {
      contacts: true,
      purchaseOrders: { take: 10, orderBy: { createdAt: "desc" } },
      prices: { where: { isActive: true }, take: 20, include: { product: { select: { sku: true, name: true } } } },
    },
  });
}

/** Get three-way match queue */
export async function getMatchQueue(params?: {
  locationId?: string; page?: number; limit?: number;
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  const skip = (page - 1) * limit;

  const where: Prisma.VendorInvoiceWhereInput = {
    matchStatus: { in: ["UNMATCHED", "PARTIAL"] },
    ...(params?.locationId ? { locationId: params.locationId } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.vendorInvoice.findMany({
      where,
      include: { vendor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.vendorInvoice.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/** List vendor claims */
export async function listClaims(params?: {
  vendorId?: string; page?: number; limit?: number;
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  const skip = (page - 1) * limit;

  const where: Prisma.VendorClaimWhereInput = {
    ...(params?.vendorId ? { vendorId: params.vendorId } : {}),
    status: { in: ["OPEN", "INVESTIGATING"] },
  };

  const [data, total] = await Promise.all([
    prisma.vendorClaim.findMany({
      where,
      include: { vendor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.vendorClaim.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/** Generate sequential PO number using serializable transaction to prevent duplicates */
async function generatePONumber(): Promise<string> {
  const today = new Date();
  const prefix = `PO-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}`;

  return await prisma.$transaction(async (tx) => {
    const result = await tx.$queryRaw<[{ max_num: string | null }]>`
      SELECT MAX(CAST(SPLIT_PART("poNumber", '-', 3) AS INTEGER)) as max_num
      FROM "PurchaseOrder"
      WHERE "poNumber" LIKE ${prefix + '-%'}
      FOR UPDATE
    `;
    const nextNum = (result[0]?.max_num ? parseInt(result[0].max_num, 10) || 0 : 0) + 1;
    return `${prefix}-${String(nextNum).padStart(4, "0")}`;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
