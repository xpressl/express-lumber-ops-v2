import { apiHandler, jsonResponse, createdResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { parsePagination, paginatedResponse } from "@/lib/middleware/pagination";
import { listProducts, createProduct } from "@/lib/services/product.service";
import { createProductSchema } from "@/lib/validators/product";
import { toActor } from "@/lib/events/audit-helpers";

export const GET = apiHandler(async (request, { scopeFilter }) => {
  const url = new URL(request.url);
  const pagination = parsePagination(url);
  const result = await listProducts({
    search: url.searchParams.get("search") ?? undefined,
    categoryId: url.searchParams.get("categoryId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    vendorId: url.searchParams.get("vendorId") ?? undefined,
    locationId: url.searchParams.get("locationId") ?? undefined,
    page: pagination.page, limit: pagination.limit,
    sortBy: url.searchParams.get("sortBy") ?? undefined,
    sortOrder: (url.searchParams.get("sortOrder") as "asc" | "desc") ?? undefined,
    scopeFilter,
  });
  return jsonResponse(paginatedResponse(result.data, result.total, pagination));
}, { permission: "pricing.view_catalogue" });

export const POST = apiHandler(async (request, { user }) => {
  const body = await validateBody(request, createProductSchema);
  const product = await createProduct(body, toActor(user));
  return createdResponse(product);
}, { permission: "pricing.edit_sell_price" });
