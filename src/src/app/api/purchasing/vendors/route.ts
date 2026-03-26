import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { listVendors } from "@/lib/services/purchasing.service";

export const GET = apiHandler(async (request, { scopeFilter }) => {
  const url = new URL(request.url);
  const vendors = await listVendors({
    search: url.searchParams.get("search") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    page: url.searchParams.get("page") ? Number(url.searchParams.get("page")) : undefined,
    limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined,
  });
  return jsonResponse(vendors);
}, { permission: "purchasing.view" });
