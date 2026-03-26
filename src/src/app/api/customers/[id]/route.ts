import { apiHandler, jsonResponse, noContentResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { getCustomerById, updateCustomer, deleteCustomer, checkCredit } from "@/lib/services/customer.service";
import { updateCustomerSchema } from "@/lib/validators/customer";
import { NotFoundError } from "@/lib/middleware/error-handler";
import { toActor } from "@/lib/events/audit-helpers";

export const GET = apiHandler(async (request, { params, scopeFilter }) => {
  const id = params?.["id"];
  if (!id) throw new NotFoundError("Customer");

  const url = new URL(request.url);
  if (url.searchParams.get("creditCheck") === "true") {
    const result = await checkCredit(id);
    return jsonResponse(result);
  }

  const customer = await getCustomerById(id, scopeFilter);
  if (!customer) throw new NotFoundError("Customer", id);
  return jsonResponse(customer);
}, { permission: "customers.view" });

export const PUT = apiHandler(async (request, { params, user }) => {
  const id = params?.["id"];
  if (!id) throw new NotFoundError("Customer");
  const body = await validateBody(request, updateCustomerSchema);
  const customer = await updateCustomer(id, body, toActor(user));
  return jsonResponse(customer);
}, { permission: "customers.edit" });

export const DELETE = apiHandler(async (_request, { params, user }) => {
  const id = params?.["id"];
  if (!id) throw new NotFoundError("Customer");
  await deleteCustomer(id, toActor(user));
  return noContentResponse();
}, { permission: "customers.edit" });
