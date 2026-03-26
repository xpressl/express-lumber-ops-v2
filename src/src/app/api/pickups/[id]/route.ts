import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { customerArrived, assignLane, handoff } from "@/lib/services/pickup.service";
import { NotFoundError } from "@/lib/middleware/error-handler";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["arrived", "assign_lane", "handoff"]),
  lane: z.string().optional(),
  bay: z.string().optional(),
});

export const POST = apiHandler(async (request, { params, user }) => {
  const id = params?.["id"];
  if (!id) throw new NotFoundError("PickupTicket");
  const body = actionSchema.parse(await request.json());

  switch (body.action) {
    case "arrived":
      return jsonResponse(await customerArrived(id, user.id));
    case "assign_lane":
      return jsonResponse(await assignLane(id, body.lane ?? "", body.bay));
    case "handoff":
      return jsonResponse(await handoff(id, user.id));
    default:
      return jsonResponse({ error: "Unknown action" }, 400);
  }
});
