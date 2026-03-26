import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { captureCod } from "@/lib/services/delivery.service";
import { captureCodSchema } from "@/lib/validators/delivery";
import { NotFoundError } from "@/lib/middleware/error-handler";
import { toActor } from "@/lib/events/audit-helpers";

export const POST = apiHandler(async (request, { params, user }) => {
  const stopId = params?.["id"];
  if (!stopId) throw new NotFoundError("RouteStop");
  const body = captureCodSchema.parse(await request.json());
  const collection = await captureCod(stopId, {
    ...body,
    orderId: "", // TODO: resolve from stop
    customerId: "", // TODO: resolve from stop
  }, toActor(user));
  return jsonResponse(collection);
}, { permission: "delivery.capture_cod" });
