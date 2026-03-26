import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/events/audit";
import { emitToRoom } from "@/lib/socket";
import { transitionOrder } from "@/lib/services/order.service";
import type { Actor } from "@/lib/events/audit-helpers";

export interface CreateRouteInput {
  date: string;
  truckId: string;
  driverId: string;
  orderIds: string[];
  routeNotes?: string;
  locationId: string;
}

/** Create a new route with stops */
export async function createRoute(input: CreateRouteInput, actor: Actor) {
  const routeNumber = await generateRouteNumber(input.date);

  const route = await prisma.route.create({
    data: {
      routeNumber,
      date: new Date(input.date),
      truckId: input.truckId,
      driverId: input.driverId,
      dispatcherId: actor.id,
      status: "PLANNING",
      totalStops: input.orderIds.length,
      routeNotes: input.routeNotes,
      locationId: input.locationId,
    },
  });

  // Batch-fetch all orders for stops
  const orders = await prisma.order.findMany({
    where: { id: { in: input.orderIds } },
    include: { customer: { select: { companyName: true } } },
  });
  const orderMap = new Map(orders.map((o) => [o.id, o]));

  // Create stops and link orders in parallel batches
  await Promise.all(input.orderIds.map(async (orderId, i) => {
    const order = orderMap.get(orderId);
    if (!order) return;

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

    await prisma.order.update({
      where: { id: orderId },
      data: { routeId: route.id, truckId: input.truckId, stopSequence: i + 1 },
    });
  }));

  // Calculate totals from already-fetched orders
  const totalWeight = orders.reduce((sum, o) => sum + (Number(o.totalWeight) || 0), 0);
  const totalPieces = orders.reduce((sum, o) => sum + (o.totalPieces || 0), 0);

  await prisma.route.update({
    where: { id: route.id },
    data: { totalWeight, totalPieces },
  });

  await createAuditEvent({
    actorId: actor.id, actorName: actor.name, action: "dispatch.route_created",
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
export async function reorderStops(routeId: string, stopIds: string[], actor: Actor) {
  await prisma.$transaction(
    stopIds.map((id, i) => prisma.routeStop.update({ where: { id }, data: { sequence: i + 1 } })),
  );

  const route = await prisma.route.findUnique({ where: { id: routeId } });
  if (route) {
    emitToRoom(`dispatch:${route.locationId}`, "route:updated", { routeId, action: "reordered" });
  }

  await createAuditEvent({
    actorId: actor.id, actorName: actor.name, action: "dispatch.stops_reordered",
    entityType: "Route", entityId: routeId,
  });
}

/** Release a route for dispatch */
export async function releaseRoute(routeId: string, actor: Actor) {
  const route = await prisma.route.update({
    where: { id: routeId },
    data: { status: "DISPATCHED", departedAt: new Date() },
  });

  // Transition all stops' orders to DISPATCHED via state machine
  const stops = await prisma.routeStop.findMany({ where: { routeId } });
  for (const stop of stops) {
    await transitionOrder(stop.orderId, "DISPATCHED", actor, "Route released for dispatch");
  }

  emitToRoom(`dispatch:${route.locationId}`, "route:updated", {
    routeId, status: "DISPATCHED",
  });

  await createAuditEvent({
    actorId: actor.id, actorName: actor.name, action: "dispatch.route_released",
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
  page?: number;
  limit?: number;
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const skip = (page - 1) * limit;

  const where: Prisma.RouteWhereInput = {
    ...(params.date ? { date: new Date(params.date) } : {}),
    ...(params.status ? { status: params.status as "PLANNING" | "READY" | "DISPATCHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" } : {}),
    ...(params.locationId ? { locationId: params.locationId } : {}),
    ...(params.truckId ? { truckId: params.truckId } : {}),
    ...(params.driverId ? { driverId: params.driverId } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.route.findMany({
      where,
      include: {
        truck: { select: { number: true, type: true } },
        stops: { orderBy: { sequence: "asc" }, select: { id: true, sequence: true, orderId: true, customerName: true, status: true, address: true } },
      },
      orderBy: { routeNumber: "asc" },
      skip,
      take: limit,
    }),
    prisma.route.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/** Get route by ID */
export async function getRouteById(routeId: string, _scopeFilter?: Record<string, unknown>) {
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

  return await prisma.$transaction(async (tx) => {
    const result = await tx.$queryRaw<[{ max_num: string | null }]>`
      SELECT MAX(CAST(SPLIT_PART("routeNumber", '-', 3) AS INTEGER)) as max_num
      FROM "Route"
      WHERE "routeNumber" LIKE ${prefix + '-%'}
      FOR UPDATE
    `;
    const nextNum = (result[0]?.max_num ? parseInt(result[0].max_num, 10) || 0 : 0) + 1;
    return `${prefix}-${String(nextNum).padStart(2, "0")}`;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
