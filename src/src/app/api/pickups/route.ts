import { apiHandler, jsonResponse, createdResponse } from "@/lib/middleware/api-handler";
import { listPickups, createPickup } from "@/lib/services/pickup.service";
import { toActor } from "@/lib/events/audit-helpers";
import { z } from "zod";

const createPickupSchema = z.object({
  orderId: z.string().min(1),
  customerId: z.string().min(1),
  locationId: z.string().min(1),
});

export const GET = apiHandler(async (request, { user, scopeFilter }) => {
  const url = new URL(request.url);
  const locationId = url.searchParams.get("locationId") ?? user.defaultLocationId ?? "";
  const status = url.searchParams.get("status") ?? undefined;
  const pickups = await listPickups(locationId, status, scopeFilter);
  return jsonResponse(pickups);
}, { permission: "orders.view" });

export const POST = apiHandler(async (request, { user }) => {
  const body = createPickupSchema.parse(await request.json());
  const ticket = await createPickup(body.orderId, body.customerId, body.locationId, toActor(user));
  return createdResponse(ticket);
}, { permission: "orders.create" });
