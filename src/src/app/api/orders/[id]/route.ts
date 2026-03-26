import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { getOrderById } from "@/lib/services/order.service";
import { NotFoundError } from "@/lib/middleware/error-handler";

export const GET = apiHandler(async (_request, { params }) => {
  const id = params?.["id"];
  if (!id) throw new NotFoundError("Order");
  const order = await getOrderById(id);
  if (!order) throw new NotFoundError("Order", id);
  return jsonResponse(order);
}, { permission: "orders.view" });
