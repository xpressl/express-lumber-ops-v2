import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { getMatchQueue } from "@/lib/services/purchasing.service";

export const GET = apiHandler(async (request, { user, scopeFilter }) => {
  const url = new URL(request.url);
  const locationId = url.searchParams.get("locationId") ?? user.defaultLocationId ?? undefined;
  const page = url.searchParams.get("page") ? Number(url.searchParams.get("page")) : undefined;
  const limit = url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined;
  const queue = await getMatchQueue({ locationId, page, limit });
  return jsonResponse(queue);
}, { permission: "purchasing.approve_ap_match" });
