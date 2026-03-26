import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { getMyRoute, updateDriverLocation } from "@/lib/services/delivery.service";
import { z } from "zod";

export const GET = apiHandler(async (_request, { user, scopeFilter }) => {
  const route = await getMyRoute(user.id, scopeFilter);
  return jsonResponse(route);
}, { permission: "delivery.view_routes" });

const locationSchema = z.object({ lat: z.number(), lng: z.number() });

export const POST = apiHandler(async (request, { user }) => {
  const body = locationSchema.parse(await request.json());
  await updateDriverLocation(user.id, body.lat, body.lng);
  return jsonResponse({ success: true });
}, { permission: "delivery.view_routes" });
