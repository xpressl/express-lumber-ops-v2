import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/events/audit";
import { emitToRoom } from "@/lib/socket";

export interface CreateRouteInput {
  date: string;
  truckId: string;
  driverId: string;
  orderIds: string[];
  routeNotes?: string;
  locationId: string;
}

/** Create a new route with stops */
export async function createRoute(input: CreateRouteInput, actorId: string) {
  const routeNumber = await generateRouteNumber(input.date);

  const route = await prisma.route.create({
    data: {
      routeNumber,
      date: new Date(input.date),
      truckId: input.truckId,
      driverId: input.driverId,
      dispatcherId: actorId,
      status: "PLANNING",
      totalStops: input.orderIds.length,
      routeNotes: input.routeNotes,
      locationId: input.locationId,
    },
  });

  // Create stops from orders
  for (let i = 0; i < input.orderIds.length; i++) {
    const orderId = input.orderIds[i]!;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: { select: { companyName: true } } },
    });
    if (!order) continue;

    await prisma.routeStop.create({
      data: {
        routeId: route.id,
        orderId,
        sequence: i + 1,
        address: order.deliveryAddress ?? ({} as Prisma.InputJsonValue),
        customerName: order.customer.companyName,
        contactName: order.contactName,
        contactPhone: order.contactPhone,
        deliveryInstructions: order.specialInstructions,
        appointmentWindow: order.appointmentWindow,
      },
    });

    // Link order to route
    await prisma.order.update({
      where: { id: orderId },
      data: { routeId: route.id, truckId: input.truckId, stopSequence: i + 1 },
    });
  }

  // Calculate totals
  const orders = await prisma.order.findMany({
    where: { id: { in: input.orderIds } },
    select: { totalWeight: true, totalPieces: true },
  });
  const totalWeight = orders.reduce((sum, o) => sum + (Number(o.totalWeight) || 0), 0);
  const totalPieces = orders.reduce((sum, o) => sum + (o.totalPieces || 0), 0);

  await prisma.route.update({
    where: { id: route.id },
    data: { totalWeight, totalPieces },
  });

  await createAuditEvent({
    actorId, actorName: "System", action: "dispatch.route_created",
    entityType: "Route", entityId: route.id, entityName: routeNumber,
    locationId: input.locationId,
    metadata: { truckId: input.truckId, orderCount: input.orderIds.length, totalWeight } as Record<string, unknown>,
  });

  emitToRoom(`dispatch:${input.locationId}`, "route:updated", {
    routeId: route.id, routeNumber, status: "PLANNING",
  });

  return route;
}

/** Reorder stops on a route */
export async function reorderStops(routeId: string, stopIds: string[], actorId: string) {
  for (let i = 0; i < stopIds.length; i++) {
    await prisma.routeStop.update({
      where: { id: stopIds[i] },
      data: { sequence: i + 1 },
    });
  }

  const route = await prisma.route.findUnique({ where: { id: routeId } });
  if (route) {
    emitToRoom(`dispatch:${route.locationId}`, "route:updated", { routeId, action: "reordered" });
  }

  await createAuditEvent({
    actorId, actorName: "System", action: "dispatch.stops_reordered",
    entityType: "Route", entityId: routeId,
  });
}

/** Release a route for dispatch */
export async function releaseRoute(routeId: string, actorId: string) {
  const route = await prisma.route.update({
    where: { id: routeId },
    data: { status: "DISPATCHED", departedAt: new Date() },
  });

  // Update all stops' orders to DISPATCHED
  const stops = await prisma.routeStop.findMany({ where: { routeId } });
  for (const stop of stops) {
    await prisma.order.update({
      where: { id: stop.orderId },
      data: { status: "DISPATCHED", dispatchedAt: new Date() },
    });
  }

  emitToRoom(`dispatch:${route.locationId}`, "route:updated", {
    routeId, status: "DISPATCHED",
  });

  await createAuditEvent({
    actorId, actorName: "System", action: "dispatch.route_released",
    entityType: "Route", entityId: routeId, entityName: route.routeNumber,
    locationId: route.locationId,
  });

  return route;
}

/** List routes for dispatch board */
export async function listRoutes(params: {
  date?: string;
  status?: string;
  locationId?: string;
  truckId?: string;
  driverId?: string;
}) {
  const where: Prisma.RouteWhereInput = {
    ...(params.date ? { date: new Date(params.date) } : {}),
    ...(params.status ? { status: params.status as "PLANNING" | "READY" | "DISPATCHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" } : {}),
    ...(params.locationId ? { locationId: params.locationId } : {}),
    ...(params.truckId ? { truckId: params.truckId } : {}),
    ...(params.driverId ? { driverId: params.driverId } : {}),
  };

  return prisma.route.findMany({
    where,
    include: {
      truck: { select: { number: true, type: true } },
      stops: { orderBy: { sequence: "asc" }, select: { id: true, sequence: true, orderId: true, customerName: true, status: true, address: true } },
    },
    orderBy: { routeNumber: "asc" },
  });
}

/** Get route by ID */
export async function getRouteById(routeId: string) {
  return prisma.route.findUnique({
    where: { id: routeId },
    include: {
      truck: true,
      stops: {
        orderBy: { sequence: "asc" },
        include: { deliveryProof: true, codCollection: true },
      },
    },
  });
}

async function generateRouteNumber(date: string): Promise<string> {
  const d = new Date(date);
  const prefix = `RT-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const count = await prisma.route.count({ where: { routeNumber: { startsWith: prefix } } });
  return `${prefix}-${String(count + 1).padStart(2, "0")}`;
}
