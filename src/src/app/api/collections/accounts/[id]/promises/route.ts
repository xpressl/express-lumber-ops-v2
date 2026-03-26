import { apiHandler, createdResponse } from "@/lib/middleware/api-handler";
import { createPromise } from "@/lib/services/collections.service";
import { createPromiseSchema } from "@/lib/validators/collections";
import { toActor } from "@/lib/events/audit-helpers";

export const POST = apiHandler(async (request, { params, user }) => {
  const accountId = params?.["id"] ?? "";
  const body = createPromiseSchema.parse(await request.json());
  const promise = await createPromise(accountId, "", body, toActor(user)); // customerId resolved from account
  return createdResponse(promise);
}, { permission: "collections.create_promise" });
