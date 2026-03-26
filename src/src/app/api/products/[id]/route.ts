import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { getProductById, updateProduct } from "@/lib/services/product.service";
import { updateProductSchema } from "@/lib/validators/product";
import { NotFoundError } from "@/lib/middleware/error-handler";

export const GET = apiHandler(async (_request, { params }) => {
  const id = params?.["id"];
  if (!id) throw new NotFoundError("Product");
  const product = await getProductById(id);
  if (!product) throw new NotFoundError("Product", id);
  return jsonResponse(product);
}, { permission: "pricing.view_catalogue" });

export const PUT = apiHandler(async (request, { params, user }) => {
  const id = params?.["id"];
  if (!id) throw new NotFoundError("Product");
  const body = await validateBody(request, updateProductSchema);
  const product = await updateProduct(id, body, user.id);
  return jsonResponse(product);
}, { permission: "pricing.edit_sell_price" });
