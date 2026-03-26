import { apiHandler, jsonResponse, createdResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { parsePagination, paginatedResponse } from "@/lib/middleware/pagination";
import { listOrders, createOrder } from "@/lib/services/order.service";
import { createOrderSchema } from "@/lib/validators/order";
import { toActor } from "@/lib/events/audit-helpers";

export const GET = apiHandler(async (request, { scopeFilter }) => {
  const url = new URL(request.url);
  const pagination = parsePagination(url);
  const result = await listOrders({
    search: url.searchParams.get("search") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    customerId: url.searchParams.get("customerId") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
    dateFrom: url.searchParams.get("dateFrom") ?? undefined,
    dateTo: url.searchParams.get("dateTo") ?? undefined,
    locationId: url.searchParams.get("locationId") ?? undefined,
    salesRepId: url.searchParams.get("salesRepId") ?? undefined,
    page: pagination.page, limit: pagination.limit,
    sortBy: url.searchParams.get("sortBy") ?? undefined,
    sortOrder: (url.searchParams.get("sortOrder") as "asc" | "desc") ?? undefined,
    scopeFilter,
  });
  return jsonResponse(paginatedResponse(result.data, result.total, pagination));
}, { permission: "orders.view" });

export const POST = apiHandler(async (request, { user }) => {
  const body = await validateBody(request, createOrderSchema);
  const order = await createOrder(body, toActor(user));
  return createdResponse(order);
}, { permission: "orders.create" });
