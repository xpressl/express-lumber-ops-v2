import { apiHandler, jsonResponse, createdResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { prisma } from "@/lib/prisma";
import { createContactSchema } from "@/lib/validators/customer";
import { NotFoundError } from "@/lib/middleware/error-handler";

export const GET = apiHandler(async (_request, { params, scopeFilter }) => {
  const customerId = params?.["id"];
  if (!customerId) throw new NotFoundError("Customer");
  const contacts = await prisma.customerContact.findMany({
    where: { customerId, deletedAt: null, customer: { ...scopeFilter } },
    orderBy: [{ isPrimary: "desc" }, { lastName: "asc" }],
  });
  return jsonResponse(contacts);
}, { permission: "customers.view" });

export const POST = apiHandler(async (request, { params }) => {
  const customerId = params?.["id"];
  if (!customerId) throw new NotFoundError("Customer");
  const body = await validateBody(request, createContactSchema);
  const contact = await prisma.customerContact.create({
    data: { ...body, customerId },
  });
  return createdResponse(contact);
}, { permission: "customers.edit" });
