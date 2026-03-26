import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/events/audit";
import { emitToRoom } from "@/lib/socket";
import type { PickupStatus } from "@prisma/client";

/** List pickup tickets for queue */
export async function listPickups(locationId: string, status?: string) {
  return prisma.pickupTicket.findMany({
    where: {
      locationId,
      ...(status ? { status: status as PickupStatus } : {
        status: { in: ["WAITING", "CUSTOMER_ARRIVED", "PREPPING", "READY_AT_LANE", "LOADING"] },
      }),
    },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });
}

/** Create pickup ticket from order */
export async function createPickup(orderId: string, customerId: string, locationId: string, actorId: string) {
  const ticket = await prisma.pickupTicket.create({
    data: { orderId, customerId, locationId, status: "WAITING" },
  });

  emitToRoom(`pickup:${locationId}`, "pickup:status-changed", {
    ticketId: ticket.id, status: "WAITING", locationId,
  });

  return ticket;
}

/** Customer arrival check-in */
export async function customerArrived(ticketId: string, actorId: string) {
  const ticket = await prisma.pickupTicket.update({
    where: { id: ticketId },
    data: { status: "CUSTOMER_ARRIVED", arrivedAt: new Date() },
  });

  emitToRoom(`pickup:${ticket.locationId}`, "pickup:customer-arrived", {
    ticketId: ticket.id, locationId: ticket.locationId,
  });

  return ticket;
}

/** Assign lane/bay */
export async function assignLane(ticketId: string, lane: string, bay?: string) {
  return prisma.pickupTicket.update({
    where: { id: ticketId },
    data: { lane, bay, status: "READY_AT_LANE" },
  });
}

/** Complete handoff */
export async function handoff(ticketId: string, actorId: string) {
  const ticket = await prisma.pickupTicket.update({
    where: { id: ticketId },
    data: { status: "HANDED_OFF", handedOffAt: new Date(), handedOffBy: actorId },
  });

  await createAuditEvent({
    actorId, actorName: "System", action: "pickup.handed_off",
    entityType: "PickupTicket", entityId: ticket.id,
    locationId: ticket.locationId,
  });

  return ticket;
}
