import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/events/audit";
import { createException } from "@/lib/exceptions/engine";
import { emitToRoom } from "@/lib/socket";
import { transitionOrder } from "@/lib/services/order.service";
import type { StopStatus, StopOutcome } from "@prisma/client";

/** Get driver's current route and stops */
export async function getMyRoute(driverId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.route.findFirst({
    where: {
      driverId,
      date: { gte: today },
      status: { in: ["DISPATCHED", "IN_PROGRESS"] },
    },
    include: {
      truck: { select: { number: true, type: true } },
      stops: {
        orderBy: { sequence: "asc" },
        include: { deliveryProof: true, codCollection: true },
      },
    },
  });
}

/** Mark stop as arrived */
export async function arriveAtStop(stopId: string, lat: number, lng: number, actorId: string) {
  const stop = await prisma.routeStop.update({
    where: { id: stopId },
    data: { status: "ARRIVED", actualArrival: new Date(), geofenceEntered: true, geofenceLat: lat, geofenceLng: lng },
  });

  const route = await prisma.route.findFirst({ where: { stops: { some: { id: stopId } } } });
  if (route) {
    emitToRoom(`dispatch:${route.locationId}`, "stop:status-changed", { stopId, status: "ARRIVED", routeId: route.id });

    await createAuditEvent({
      actorId, actorName: actorId, action: "delivery.stop_arrived",
      entityType: "RouteStop", entityId: stopId,
      locationId: route.locationId,
      metadata: { lat, lng } as Record<string, unknown>,
    });
  }

  return stop;
}

/** Complete a stop with outcome */
export async function completeStop(stopId: string, outcome: StopOutcome, actorId: string, notes?: string) {
  const stop = await prisma.routeStop.update({
    where: { id: stopId },
    data: { status: "COMPLETED", outcome, completedAt: new Date(), failureReason: notes },
  });

  // Update route progress
  const route = await prisma.route.findFirst({
    where: { stops: { some: { id: stopId } } },
    include: { stops: true },
  });

  if (route) {
    const completed = route.stops.filter((s) => s.status === "COMPLETED").length;
    await prisma.route.update({
      where: { id: route.id },
      data: {
        completedStops: completed,
        ...(completed === route.totalStops ? { status: "COMPLETED", completedAt: new Date() } : { status: "IN_PROGRESS" }),
      },
    });

    // Update order status via state machine (enforces valid transitions + audit)
    const targetStatus = outcome === "DELIVERED" ? "DELIVERED" : outcome === "REFUSED" ? "REFUSED" : "RESCHEDULED";
    try {
      await transitionOrder(stop.orderId, targetStatus, actorId, `Stop ${outcome}: ${notes ?? ""}`);
    } catch {
      // Log but don't fail the stop completion if transition fails
      console.error(`[Delivery] Failed to transition order ${stop.orderId} to ${targetStatus}`);
    }

    emitToRoom(`dispatch:${route.locationId}`, "stop:status-changed", {
      stopId, status: "COMPLETED", outcome, routeId: route.id,
    });

    // Create exception for failed deliveries
    if (["REFUSED", "NO_ANSWER", "SITE_CLOSED"].includes(outcome)) {
      await createException({
        category: "DELIVERY_FAILURE",
        title: `Delivery failed: ${outcome}`,
        description: notes,
        entityType: "RouteStop", entityId: stopId,
        locationId: route.locationId,
      });
    }

    await createAuditEvent({
      actorId, actorName: "System", action: "delivery.stop_completed",
      entityType: "RouteStop", entityId: stopId,
      locationId: route.locationId,
      metadata: { outcome, orderId: stop.orderId } as Record<string, unknown>,
    });
  }

  return stop;
}

/** Capture POD */
export async function capturePod(stopId: string, input: {
  signatureUrl?: string;
  signedBy?: string;
  photos?: string[];
  notes?: string;
  gpsLat: number;
  gpsLng: number;
}, actorId: string) {
  const proof = await prisma.deliveryProof.create({
    data: {
      stopId,
      signatureUrl: input.signatureUrl,
      signedBy: input.signedBy,
      photos: input.photos ?? [],
      notes: input.notes,
      gpsLat: input.gpsLat,
      gpsLng: input.gpsLng,
      capturedBy: actorId,
    },
  });

  await createAuditEvent({
    actorId, actorName: "System", action: "delivery.pod_captured",
    entityType: "DeliveryProof", entityId: proof.id,
  });

  return proof;
}

/** Capture COD */
export async function captureCod(stopId: string, input: {
  orderId: string;
  customerId: string;
  amountDue: number;
  amountCollected: number;
  paymentType: "CASH" | "CHECK" | "CREDIT_CARD" | "OTHER";
  checkNumber?: string;
  shortageReason?: string;
  proofPhotoUrl?: string;
}, actorId: string) {
  const shortageAmount = input.amountDue - input.amountCollected;

  const collection = await prisma.cODCollection.create({
    data: {
      stopId,
      orderId: input.orderId,
      customerId: input.customerId,
      amountDue: input.amountDue,
      amountCollected: input.amountCollected,
      paymentType: input.paymentType,
      checkNumber: input.checkNumber,
      shortageAmount: shortageAmount > 0 ? shortageAmount : null,
      shortageReason: shortageAmount > 0 ? input.shortageReason : null,
      proofPhotoUrl: input.proofPhotoUrl,
      collectedBy: actorId,
    },
  });

  // Exception for COD shortage
  if (shortageAmount > 0) {
    const route = await prisma.route.findFirst({ where: { stops: { some: { id: stopId } } } });
    if (route) {
      await createException({
        category: "COD_SHORT",
        title: `COD short: $${shortageAmount.toFixed(2)}`,
        entityType: "CODCollection", entityId: collection.id,
        locationId: route.locationId,
      });
    }
  }

  await createAuditEvent({
    actorId, actorName: "System", action: "delivery.cod_collected",
    entityType: "CODCollection", entityId: collection.id,
    metadata: { amountDue: input.amountDue, amountCollected: input.amountCollected } as Record<string, unknown>,
  });

  return collection;
}

/** Update driver GPS location */
export async function updateDriverLocation(driverId: string, lat: number, lng: number) {
  // Emit real-time location to dispatch
  const route = await prisma.route.findFirst({
    where: { driverId, status: { in: ["DISPATCHED", "IN_PROGRESS"] } },
    select: { locationId: true },
  });

  if (route) {
    emitToRoom(`dispatch:${route.locationId}`, "driver:location-updated", {
      driverId, lat, lng, timestamp: new Date().toISOString(),
    });
  }
}
