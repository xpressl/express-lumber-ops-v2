import { apiHandler, jsonResponse, createdResponse } from "@/lib/middleware/api-handler";
import { listEstimates, createEstimate } from "@/lib/services/crm.service";
import { createEstimateSchema } from "@/lib/validators/crm";
import { toActor } from "@/lib/events/audit-helpers";

export const GET = apiHandler(async (request, { user, scopeFilter }) => {
  const url = new URL(request.url);
  const estimates = await listEstimates({
    status: url.searchParams.get("status") ?? undefined,
    salesRepId: url.searchParams.get("salesRepId") ?? undefined,
    locationId: url.searchParams.get("locationId") ?? user.defaultLocationId ?? undefined,
    scopeFilter,
  });
  return jsonResponse(estimates);
}, { permission: "crm.view_estimates" });

export const POST = apiHandler(async (request, { user }) => {
  const body = createEstimateSchema.parse(await request.json());
  const estimate = await createEstimate(body, toActor(user));
  return createdResponse(estimate);
}, { permission: "crm.create_estimate" });
