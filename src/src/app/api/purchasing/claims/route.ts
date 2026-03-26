import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { listClaims } from "@/lib/services/purchasing.service";

export const GET = apiHandler(async (request, { scopeFilter }) => {
  const url = new URL(request.url);
  const claims = await listClaims({
    vendorId: url.searchParams.get("vendorId") ?? undefined,
    page: url.searchParams.get("page") ? Number(url.searchParams.get("page")) : undefined,
    limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined,
  });
  return jsonResponse(claims);
}, { permission: "purchasing.view" });
