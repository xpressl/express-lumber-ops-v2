import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { arriveAtStop, completeStop } from "@/lib/services/delivery.service";
import { NotFoundError } from "@/lib/middleware/error-handler";
import { z } from "zod";

const arriveSchema = z.object({ action: z.literal("arrive"), lat: z.number(), lng: z.number() });
const completeSchema = z.object({
  action: z.literal("complete"),
  outcome: z.enum(["DELIVERED", "PARTIAL", "REFUSED", "NO_ANSWER", "SITE_CLOSED", "RESCHEDULED", "DAMAGED", "LEFT_ON_SITE"]),
  notes: z.string().optional(),
});
const schema = z.union([arriveSchema, completeSchema]);

export const POST = apiHandler(async (request, { params, user }) => {
  const id = params?.["id"];
  if (!id) throw new NotFoundError("RouteStop");
  const body = schema.parse(await request.json());

  if (body.action === "arrive") {
    const stop = await arriveAtStop(id, body.lat, body.lng, user.id);
    return jsonResponse(stop);
  }

  const stop = await completeStop(id, body.outcome, user.id, body.notes);
  return jsonResponse(stop);
}, { permission: "delivery.mark_stop_complete" });
