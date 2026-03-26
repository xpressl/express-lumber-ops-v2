import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface TruckCapacity {
  truckId: string;
  maxWeight: number;
  maxPieces: number | null;
  maxBundles: number | null;
  maxLength: number | null;
  usedWeight: number;
  usedPieces: number;
  remainingWeight: number;
  remainingPieces: number;
  utilizationPercent: number;
}

/** List available trucks for a location and date */
export async function getAvailableTrucks(locationId: string, date?: Date) {
  return prisma.truck.findMany({
    where: {
      locationId,
      deletedAt: null,
      status: { in: ["AVAILABLE", "IN_USE"] },
    },
    include: {
      routes: date ? {
        where: { date: date, status: { not: "CANCELLED" } },
        select: { id: true, status: true, totalWeight: true, totalPieces: true },
      } : undefined,
    },
    orderBy: { number: "asc" },
  });
}

/** Calculate truck capacity utilization for a route */
export async function calculateCapacity(truckId: string, routeId: string): Promise<TruckCapacity> {
  const truck = await prisma.truck.findUnique({ where: { id: truckId } });
  if (!truck) throw new Error("Truck not found");

  const stops = await prisma.routeStop.findMany({
    where: { routeId },
    select: { orderId: true },
  });

  const orderIds = stops.map((s) => s.orderId);
  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    select: { totalWeight: true, totalPieces: true },
  });

  const usedWeight = orders.reduce((sum, o) => sum + (Number(o.totalWeight) || 0), 0);
  const usedPieces = orders.reduce((sum, o) => sum + (o.totalPieces || 0), 0);
  const maxWeight = Number(truck.maxWeight);
  const maxPieces = truck.maxPieces;

  return {
    truckId,
    maxWeight,
    maxPieces,
    maxBundles: truck.maxBundles,
    maxLength: truck.maxLength ? Number(truck.maxLength) : null,
    usedWeight,
    usedPieces,
    remainingWeight: maxWeight - usedWeight,
    remainingPieces: maxPieces ? maxPieces - usedPieces : 0,
    utilizationPercent: maxWeight > 0 ? Math.round((usedWeight / maxWeight) * 100) : 0,
  };
}

/** List trucks with current status */
export async function listTrucks(locationId?: string) {
  return prisma.truck.findMany({
    where: {
      deletedAt: null,
      ...(locationId ? { locationId } : {}),
    },
    orderBy: { number: "asc" },
  });
}
