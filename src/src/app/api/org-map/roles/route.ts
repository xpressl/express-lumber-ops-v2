import { apiHandler, jsonResponse, createdResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { parsePagination, paginatedResponse } from "@/lib/middleware/pagination";
import { listRoleTemplates, createRoleTemplate } from "@/lib/services/role-template.service";
import { z } from "zod";

const createRoleSchema = z.object({
  title: z.string().min(1),
  orgUnitId: z.string().optional(),
  summary: z.string().optional(),
  mission: z.string().optional(),
  criticality: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  targetHeadcount: z.number().int().optional(),
  status: z.enum(["ACTIVE", "DRAFT", "DEPRECATED"]).optional(),
});

export const GET = apiHandler(async (request, { scopeFilter }) => {
  const url = new URL(request.url);
  const pagination = parsePagination(url);

  const result = await listRoleTemplates({
    orgUnitId: url.searchParams.get("orgUnitId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    page: pagination.page,
    limit: pagination.limit,
  }, scopeFilter);

  return jsonResponse(paginatedResponse(result.data, result.total, pagination));
}, { permission: "admin.manage_users" });

export const POST = apiHandler(async (request, { user }) => {
  const body = await validateBody(request, createRoleSchema);
  const role = await createRoleTemplate(body, user.id);
  return createdResponse(role);
}, { permission: "admin.manage_users" });
