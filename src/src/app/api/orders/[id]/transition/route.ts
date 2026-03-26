import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { transitionOrder } from "@/lib/services/order.service";
import { transitionOrderSchema } from "@/lib/validators/order";
import { NotFoundError } from "@/lib/middleware/error-handler";
import { toActor } from "@/lib/events/audit-helpers";

export const POST = apiHandler(async (request, { params, user }) => {
  const orderId = params?.["id"];
  if (!orderId) throw new NotFoundError("Order");
  const body = await validateBody(request, transitionOrderSchema);
  const order = await transitionOrder(orderId, body.toStatus, toActor(user), body.reason);
  return jsonResponse(order);
}, { permission: "orders.edit" });
