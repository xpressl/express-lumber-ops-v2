import { apiHandler, jsonResponse, createdResponse } from "@/lib/middleware/api-handler";
import { listTasks, createTask } from "@/lib/services/yard.service";
import { toActor } from "@/lib/events/audit-helpers";
import { z } from "zod";

const createTaskSchema = z.object({
  type: z.enum(["ORDER_PREP", "LOADING", "UNLOADING", "TRANSFER", "RECEIVING", "CYCLE_COUNT", "DAMAGE_INSPECTION", "CLEANUP"]),
  orderId: z.string().optional(),
  assignedTo: z.string().optional(),
  priority: z.number().int().optional(),
  bay: z.string().optional(),
  notes: z.string().optional(),
  locationId: z.string().min(1),
});

export const GET = apiHandler(async (request, { user, scopeFilter }) => {
  const url = new URL(request.url);
  const tasks = await listTasks({
    locationId: url.searchParams.get("locationId") ?? user.defaultLocationId ?? "",
    assignedTo: url.searchParams.get("assignedTo") ?? (url.searchParams.get("my") === "true" ? user.id : undefined),
    status: url.searchParams.get("status") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
    page: url.searchParams.get("page") ? Number(url.searchParams.get("page")) : undefined,
    limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined,
  });
  return jsonResponse(tasks);
}, { permission: "yard.view_tasks" });

export const POST = apiHandler(async (request, { user }) => {
  const body = createTaskSchema.parse(await request.json());
  const task = await createTask(body, toActor(user));
  return createdResponse(task);
}, { permission: "yard.assign_tasks" });
