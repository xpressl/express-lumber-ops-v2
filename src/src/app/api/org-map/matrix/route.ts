import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { getMatrixData } from "@/lib/services/coverage.service";

export const GET = apiHandler(async (request, { scopeFilter }) => {
  const url = new URL(request.url);
  const result = await getMatrixData({
    locationId: url.searchParams.get("locationId") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
  }, scopeFilter);
  return jsonResponse(result);
}, { permission: "admin.manage_users" });
