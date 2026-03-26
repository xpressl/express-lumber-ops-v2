import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { parsePagination, paginatedResponse } from "@/lib/middleware/pagination";
import { queryAuditEvents } from "@/lib/events/audit";

export const GET = apiHandler(async (request) => {
  const url = new URL(request.url);
  const pagination = parsePagination(url);

  const result = await queryAuditEvents({
    actorId: url.searchParams.get("actorId") ?? undefined,
    entityType: url.searchParams.get("entityType") ?? undefined,
    entityId: url.searchParams.get("entityId") ?? undefined,
    action: url.searchParams.get("action") ?? undefined,
    locationId: url.searchParams.get("locationId") ?? undefined,
    dateFrom: url.searchParams.get("dateFrom") ? new Date(url.searchParams.get("dateFrom")!) : undefined,
    dateTo: url.searchParams.get("dateTo") ? new Date(url.searchParams.get("dateTo")!) : undefined,
    page: pagination.page,
    limit: pagination.limit,
  });

  return jsonResponse(paginatedResponse(result.data, result.total, pagination));
}, { permission: "admin.view_audit_log" });
