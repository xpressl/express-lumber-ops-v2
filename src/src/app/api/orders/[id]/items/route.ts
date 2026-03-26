import { apiHandler, jsonResponse, createdResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { addOrderItem } from "@/lib/services/order.service";
import { addOrderItemSchema } from "@/lib/validators/order";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/middleware/error-handler";
import { toActor } from "@/lib/events/audit-helpers";

export const GET = apiHandler(async (_request, { params }) => {
  const orderId = params?.["id"];
  if (!orderId) throw new NotFoundError("Order");
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    include: { product: { select: { sku: true, name: true } } },
    orderBy: { lineNumber: "asc" },
  });
  return jsonResponse(items);
}, { permission: "orders.view" });

export const POST = apiHandler(async (request, { params, user }) => {
  const orderId = params?.["id"];
  if (!orderId) throw new NotFoundError("Order");
  const body = await validateBody(request, addOrderItemSchema);
  const item = await addOrderItem(orderId, body, toActor(user));
  return createdResponse(item);
}, { permission: "orders.edit" });
