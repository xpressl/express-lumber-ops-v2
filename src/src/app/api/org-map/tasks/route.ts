import { apiHandler, jsonResponse, createdResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { parsePagination, paginatedResponse } from "@/lib/middleware/pagination";
import { listBusinessTasks, createBusinessTask } from "@/lib/services/business-task.service";
import { z } from "zod";

const createTaskSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  processArea: z.string().min(1),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL", "EVENT_BASED", "SEASONAL"]),
  description: z.string().optional(),
  isCritical: z.boolean().optional(),
});

export const GET = apiHandler(async (request, { scopeFilter }) => {
  const url = new URL(request.url);
  const pagination = parsePagination(url);

  const result = await listBusinessTasks({
    category: url.searchParams.get("category") ?? undefined,
    processArea: url.searchParams.get("processArea") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    isCritical: url.searchParams.get("isCritical") === "true" ? true : undefined,
    search: url.searchParams.get("search") ?? undefined,
    page: pagination.page,
    limit: pagination.limit,
  }, scopeFilter);

  return jsonResponse(paginatedResponse(result.data, result.total, pagination));
}, { permission: "admin.manage_users" });

export const POST = apiHandler(async (request, { user }) => {
  const body = await validateBody(request, createTaskSchema);
  const task = await createBusinessTask(body, user.id);
  return createdResponse(task);
}, { permission: "admin.manage_users" });
