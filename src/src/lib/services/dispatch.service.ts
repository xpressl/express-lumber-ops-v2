import { prisma } from "@/lib/prisma";
import { emitToRoom } from "@/lib/socket";
import { createAuditEvent } from "@/lib/events/audit";
import { createException } from "@/lib/exceptions/engine";
import type { Prisma } from "@prisma/client";

/** Get dispatch board data - orders grouped for dispatch planning */
export async function getDispatchBoard(params: {
  date?: string;
  status?: string;
  locationId?: string;
}) {
  const where: Prisma.OrderWhereInput = {
    deletedAt: null,
    type: { in: ["DELIVERY", "TRANSFER"] },
    ...(params.status ? { status: params.status as "APPROVED" | "READY" | "LOADED" | "DISPATCHED" } : {
      status: { in: ["APPROVED", "READY", "LOADING", "LOADED", "DISPATCHED"] },
    }),
    ...(params.locationId ? { locationId: params.locationId } : {}),
    ...(params.date ? { requestedDate: { lte: new Date(params.date) } } : {}),
  };

  return prisma.order.findMany({
    where,
    include: {
      customer: { select: { companyName: true, accountNumber: true } },
      _count: { select: { items: true } },
    },
    orderBy: [{ priorityScore: "desc" }, { requestedDate: "asc" }],
  });
}

/** Assign orders to a truck */
export async function assignOrdersToTruck(
  truckId: string,
  orderIds: string[],
  actorId: string,
  locationId: string,
) {
  for (const orderId of orderIds) {
    await prisma.order.update({
      where: { id: orderId },
      data: { truckId },
    });
  }

  await createAuditEvent({
    actorId, actorName: "System", action: "dispatch.truck_assigned",
    entityType: "Truck", entityId: truckId,
    locationId,
    metadata: { orderIds, orderCount: orderIds.length } as Record<string, unknown>,
  });

  emitToRoom(`dispatch:${locationId}`, "order:assigned-to-truck", {
    truckId, orderIds, locationId,
  });
}

/** Validate dispatch checklist before releasing route */
export async function validateDispatchChecklist(routeId: string): Promise<{
  valid: boolean;
  issues: string[];
}> {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    include: {
      truck: true,
      stops: { include: { route: false } },
    },
  });

  if (!route) return { valid: false, issues: ["Route not found"] };

  const issues: string[] = [];

  if (route.stops.length === 0) issues.push("Route has no stops");
  if (!route.driverId) issues.push("No driver assigned");
  if (route.truck.status === "MAINTENANCE") issues.push("Truck is in maintenance");
  if (route.truck.status === "OUT_OF_SERVICE") issues.push("Truck is out of service");

  // Check all orders are in loadable state
  const orderIds = route.stops.map((s) => s.orderId);
  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    select: { id: true, orderNumber: true, status: true },
  });

  for (const order of orders) {
    if (!["READY", "LOADING", "LOADED"].includes(order.status)) {
      issues.push(`Order ${order.orderNumber} is not ready (status: ${order.status})`);
    }
  }

  return { valid: issues.length === 0, issues };
}

/** Get carryover queue - orders past their requested date that haven't been dispatched */
export async function getCarryoverQueue(locationId: string) {
  return prisma.order.findMany({
    where: {
      locationId,
      deletedAt: null,
      type: { in: ["DELIVERY", "TRANSFER"] },
      status: { in: ["APPROVED", "READY", "LOADING", "LOADED"] },
      requestedDate: { lt: new Date() },
      routeId: null,
    },
    include: { customer: { select: { companyName: true } } },
    orderBy: { requestedDate: "asc" },
  });
}
