import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { getCoverageStats, listCoverageGaps, listHiringRequests } from "@/lib/services/coverage.service";

export const GET = apiHandler(async (request, { scopeFilter }) => {
  const url = new URL(request.url);
  const view = url.searchParams.get("view");

  if (view === "stats") {
    const stats = await getCoverageStats(scopeFilter);
    return jsonResponse(stats);
  }

  if (view === "hiring") {
    const result = await listHiringRequests({
      status: url.searchParams.get("status") ?? undefined,
      locationId: url.searchParams.get("locationId") ?? undefined,
      urgency: url.searchParams.get("urgency") ?? undefined,
    }, scopeFilter);
    return jsonResponse(result);
  }

  const result = await listCoverageGaps({
    gapType: url.searchParams.get("gapType") ?? undefined,
    severity: url.searchParams.get("severity") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    locationId: url.searchParams.get("locationId") ?? undefined,
  }, scopeFilter);
  return jsonResponse(result);
}, { permission: "admin.manage_users" });
