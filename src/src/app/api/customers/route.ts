import { apiHandler, jsonResponse, createdResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { parsePagination, paginatedResponse } from "@/lib/middleware/pagination";
import { listCustomers, createCustomer } from "@/lib/services/customer.service";
import { createCustomerSchema } from "@/lib/validators/customer";
import { toActor } from "@/lib/events/audit-helpers";

export const GET = apiHandler(async (request, { scopeFilter }) => {
  const url = new URL(request.url);
  const pagination = parsePagination(url);

  const result = await listCustomers({
    search: url.searchParams.get("search") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    locationId: url.searchParams.get("locationId") ?? undefined,
    salesRepId: url.searchParams.get("salesRepId") ?? undefined,
    tag: url.searchParams.get("tag") ?? undefined,
    page: pagination.page,
    limit: pagination.limit,
    sortBy: url.searchParams.get("sortBy") ?? undefined,
    sortOrder: (url.searchParams.get("sortOrder") as "asc" | "desc") ?? undefined,
    scopeFilter,
  });

  return jsonResponse(paginatedResponse(result.data, result.total, pagination));
}, { permission: "customers.view" });

export const POST = apiHandler(async (request, { user }) => {
  const body = await validateBody(request, createCustomerSchema);
  const customer = await createCustomer(body, toActor(user));
  return createdResponse(customer);
}, { permission: "customers.create" });
