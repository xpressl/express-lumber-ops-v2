import { apiHandler, jsonResponse, createdResponse } from "@/lib/middleware/api-handler";
import { listPOs, createPO } from "@/lib/services/purchasing.service";
import { createPOSchema } from "@/lib/validators/pricing";
import { toActor } from "@/lib/events/audit-helpers";

export const GET = apiHandler(async (request, { user, scopeFilter }) => {
  const url = new URL(request.url);
  const pos = await listPOs({
    vendorId: url.searchParams.get("vendorId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    locationId: url.searchParams.get("locationId") ?? user.defaultLocationId ?? undefined,
    page: url.searchParams.get("page") ? Number(url.searchParams.get("page")) : undefined,
    limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined,
  });
  return jsonResponse(pos);
}, { permission: "purchasing.view" });

export const POST = apiHandler(async (request, { user }) => {
  const body = createPOSchema.parse(await request.json());
  const po = await createPO(body, toActor(user));
  return createdResponse(po);
}, { permission: "purchasing.create_po" });
