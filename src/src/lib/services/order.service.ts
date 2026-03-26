import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/events/audit";
import { createException } from "@/lib/exceptions/engine";
import { validateTransition, computeReadinessPercent } from "@/lib/state-machines/order";
import { checkCredit } from "@/lib/services/customer.service";
import type { CreateOrderInput, AddOrderItemInput } from "@/lib/validators/order";
import type { OrderStatus } from "@prisma/client";

/** Create a new order */
export async function createOrder(input: CreateOrderInput, actorId: string) {
  // Credit check
  const creditResult = await checkCredit(input.customerId);

  const order = await prisma.order.create({
    data: {
      orderNumber: await generateOrderNumber(),
      type: input.type,
      status: creditResult.allowed ? "DRAFT" : "ON_CREDIT_HOLD",
      customerId: input.customerId,
      customerPO: input.customerPO,
      jobsiteName: input.jobsiteName,
      deliveryAddress: input.deliveryAddress as Prisma.InputJsonValue ?? undefined,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      salesRepId: input.salesRepId,
      requestedDate: new Date(input.requestedDate),
      appointmentFlag: input.appointmentFlag ?? false,
      appointmentWindow: input.appointmentWindow,
      codFlag: input.codFlag ?? false,
      codAmount: input.codAmount,
      specialInstructions: input.specialInstructions,
      internalNotes: input.internalNotes,
      locationId: input.locationId,
      createdBy: actorId,
      holdReasons: !creditResult.allowed ? [creditResult.reason ?? "Credit check failed"] : [],
    },
  });

  // Create initial event
  await prisma.orderEvent.create({
    data: {
      orderId: order.id,
      toStatus: order.status,
      actorId,
      actorName: "System",
      reason: !creditResult.allowed ? creditResult.reason : undefined,
    },
  });

  await createAuditEvent({
    actorId, actorName: "System", action: "order.created",
    entityType: "Order", entityId: order.id, entityName: order.orderNumber,
    locationId: input.locationId,
  });

  // Create exception if on credit hold
  if (!creditResult.allowed) {
    await createException({
      category: "HOLD_WITH_URGENT_ORDER",
      title: `Credit hold: ${order.orderNumber}`,
      description: creditResult.reason,
      entityType: "Order", entityId: order.id, entityName: order.orderNumber,
      locationId: input.locationId,
    });
  }

  return order;
}

/** Transition order status */
export async function transitionOrder(orderId: string, toStatus: string, actorId: string, reason?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  const result = validateTransition(order.status, toStatus as OrderStatus);
  if (!result.valid) throw new Error(result.error);

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: toStatus as OrderStatus,
      ...(toStatus === "DISPATCHED" ? { dispatchedAt: new Date() } : {}),
      ...(toStatus === "DELIVERED" ? { deliveredAt: new Date() } : {}),
      ...(toStatus === "CLOSED" ? { closedAt: new Date() } : {}),
    },
  });

  await prisma.orderEvent.create({
    data: {
      orderId, fromStatus: order.status, toStatus,
      actorId, actorName: "System", reason,
    },
  });

  await createAuditEvent({
    actorId, actorName: "System", action: "order.status_changed",
    entityType: "Order", entityId: orderId, entityName: order.orderNumber,
    locationId: order.locationId,
    before: { status: order.status } as Record<string, unknown>,
    after: { status: toStatus } as Record<string, unknown>,
  });

  return updated;
}

/** Add item to order */
export async function addOrderItem(orderId: string, input: AddOrderItemInput, actorId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new Error("Product not found");

  const lineNumber = await prisma.orderItem.count({ where: { orderId } }) + 1;
  const extendedPrice = input.quantity * input.unitPrice;

  const item = await prisma.orderItem.create({
    data: {
      orderId,
      productId: input.productId,
      lineNumber,
      description: product.name,
      quantity: input.quantity,
      uom: input.uom,
      unitPrice: input.unitPrice,
      unitCost: Number(product.currentCost),
      extendedPrice,
      length: input.length,
      weight: product.weight ? Number(product.weight) * input.quantity : null,
      substitutionAllowed: input.substitutionAllowed ?? false,
      notes: input.notes,
    },
  });

  // Update order totals
  await recalculateOrderTotals(orderId);

  return item;
}

/** List orders with filters */
export async function listOrders(params: {
  search?: string;
  status?: string;
  customerId?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  locationId?: string;
  salesRepId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  scopeFilter?: Record<string, unknown>;
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Prisma.OrderWhereInput = {
    deletedAt: null,
    // Apply RBAC scope filter (branch/own/assigned restrictions)
    ...params.scopeFilter,
    ...(params.search ? {
      OR: [
        { orderNumber: { contains: params.search, mode: "insensitive" as const } },
        { customer: { companyName: { contains: params.search, mode: "insensitive" as const } } },
        { customerPO: { contains: params.search, mode: "insensitive" as const } },
      ],
    } : {}),
    ...(params.status ? { status: params.status as OrderStatus } : {}),
    ...(params.customerId ? { customerId: params.customerId } : {}),
    ...(params.type ? { type: params.type as "DELIVERY" | "PICKUP" | "WILL_CALL" | "TRANSFER" | "RETURN_PICKUP" | "VENDOR_DROP_SHIP" } : {}),
    ...(params.locationId ? { locationId: params.locationId } : {}),
    ...(params.salesRepId ? { salesRepId: params.salesRepId } : {}),
    ...(params.dateFrom || params.dateTo ? {
      requestedDate: {
        ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
        ...(params.dateTo ? { lte: new Date(params.dateTo) } : {}),
      },
    } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: { select: { companyName: true, accountNumber: true } },
        _count: { select: { items: true } },
      },
      skip, take: limit,
      orderBy: { [params.sortBy ?? "requestedDate"]: params.sortOrder ?? "desc" },
    }),
    prisma.order.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/** Get order with full details */
export async function getOrderById(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: { select: { companyName: true, accountNumber: true, status: true } },
      items: { include: { product: { select: { sku: true, name: true } } }, orderBy: { lineNumber: "asc" } },
      events: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
}

/** Recalculate order totals from items */
async function recalculateOrderTotals(orderId: string) {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  const totalAmount = items.reduce((sum, i) => sum + Number(i.extendedPrice), 0);
  const totalWeight = items.reduce((sum, i) => sum + (Number(i.weight) || 0), 0);
  const totalPieces = items.length;
  const readinessPercent = computeReadinessPercent(items);
  const totalCost = items.reduce((sum, i) => sum + Number(i.unitCost) * Number(i.quantity), 0);
  const marginPercent = totalAmount > 0 ? ((totalAmount - totalCost) / totalAmount) * 100 : 0;

  await prisma.order.update({
    where: { id: orderId },
    data: { totalAmount, totalWeight, totalPieces, readinessPercent, marginPercent },
  });
}

/** Generate sequential order number with collision retry */
async function generateOrderNumber(): Promise<string> {
  const today = new Date();
  const prefix = `ORD-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await prisma.order.count({ where: { orderNumber: { startsWith: prefix } } });
    const candidate = `${prefix}-${String(count + 1 + attempt).padStart(4, "0")}`;
    const exists = await prisma.order.findFirst({ where: { orderNumber: candidate } });
    if (!exists) return candidate;
  }
  // Fallback: use timestamp suffix to guarantee uniqueness
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}
