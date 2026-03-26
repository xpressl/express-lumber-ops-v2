import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { updateTaskStatus, assignTask } from "@/lib/services/yard.service";
import { NotFoundError } from "@/lib/middleware/error-handler";
import { toActor } from "@/lib/events/audit-helpers";
import { z } from "zod";

const updateSchema = z.object({
  action: z.enum(["start", "complete", "assign", "block", "cancel"]),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});

export const POST = apiHandler(async (request, { params, user }) => {
  const id = params?.["id"];
  if (!id) throw new NotFoundError("YardTask");
  const body = updateSchema.parse(await request.json());

  switch (body.action) {
    case "start":
      return jsonResponse(await updateTaskStatus(id, "IN_PROGRESS", toActor(user), body.notes));
    case "complete":
      return jsonResponse(await updateTaskStatus(id, "COMPLETED", toActor(user), body.notes));
    case "assign":
      return jsonResponse(await assignTask(id, body.assignedTo ?? "", toActor(user)));
    case "block":
      return jsonResponse(await updateTaskStatus(id, "BLOCKED", toActor(user), body.notes));
    case "cancel":
      return jsonResponse(await updateTaskStatus(id, "CANCELLED", toActor(user), body.notes));
    default:
      return jsonResponse({ error: "Unknown action" }, 400);
  }
}, { permission: "yard.complete_task" });
