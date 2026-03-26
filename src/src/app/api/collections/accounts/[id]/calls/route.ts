import { apiHandler, createdResponse } from "@/lib/middleware/api-handler";
import { logCall } from "@/lib/services/collections.service";
import { logCallSchema } from "@/lib/validators/collections";
import { toActor } from "@/lib/events/audit-helpers";

export const POST = apiHandler(async (request, { params, user }) => {
  const accountId = params?.["id"] ?? "";
  const body = logCallSchema.parse(await request.json());
  const activity = await logCall(accountId, body, toActor(user));
  return createdResponse(activity);
}, { permission: "collections.log_call" });
