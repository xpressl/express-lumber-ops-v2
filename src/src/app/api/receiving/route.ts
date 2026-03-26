import { apiHandler, jsonResponse, createdResponse } from "@/lib/middleware/api-handler";
import { listReceivingRecords, startReceiving } from "@/lib/services/receiving.service";
import { startReceivingSchema } from "@/lib/validators/receiving";
import { toActor } from "@/lib/events/audit-helpers";

export const GET = apiHandler(async (request, { user, scopeFilter }) => {
  const url = new URL(request.url);
  const locationId = url.searchParams.get("locationId") ?? user.defaultLocationId ?? "";
  const status = url.searchParams.get("status") ?? undefined;
  const page = url.searchParams.get("page") ? Number(url.searchParams.get("page")) : undefined;
  const limit = url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined;
  const records = await listReceivingRecords(locationId, status, page, limit);
  return jsonResponse(records);
}, { permission: "receiving.view" });

export const POST = apiHandler(async (request, { user }) => {
  const body = startReceivingSchema.parse(await request.json());
  const record = await startReceiving(body.purchaseOrderId, body.locationId, toActor(user));
  return createdResponse(record);
}, { permission: "receiving.receive_po" });
