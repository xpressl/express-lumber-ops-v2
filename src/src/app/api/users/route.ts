import { NextResponse } from "next/server";
import { apiHandler, jsonResponse, createdResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { parsePagination, paginatedResponse } from "@/lib/middleware/pagination";
import { listUsers, createUser } from "@/lib/services/user.service";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  defaultLocationId: z.string().optional(),
});

export const GET = apiHandler(async (request) => {
  const url = new URL(request.url);
  const pagination = parsePagination(url);

  const result = await listUsers({
    search: url.searchParams.get("search") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    roleId: url.searchParams.get("roleId") ?? undefined,
    locationId: url.searchParams.get("locationId") ?? undefined,
    page: pagination.page,
    limit: pagination.limit,
    sortBy: url.searchParams.get("sortBy") ?? undefined,
    sortOrder: (url.searchParams.get("sortOrder") as "asc" | "desc") ?? undefined,
  });

  return jsonResponse(paginatedResponse(result.data, result.total, pagination));
}, { permission: "admin.manage_users" });

export const POST = apiHandler(async (request, { user }) => {
  const body = await validateBody(request, createUserSchema);
  const newUser = await createUser(body, user.id);
  return createdResponse(newUser);
}, { permission: "admin.manage_users" });
