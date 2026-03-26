import { apiHandler, createdResponse } from "@/lib/middleware/api-handler";
import { createDispute } from "@/lib/services/collections.service";
import { createDisputeSchema } from "@/lib/validators/collections";
import { toActor } from "@/lib/events/audit-helpers";

export const POST = apiHandler(async (request, { params, user }) => {
  const accountId = params?.["id"] ?? "";
  const body = createDisputeSchema.parse(await request.json());
  const dispute = await createDispute(accountId, "", body, toActor(user));
  return createdResponse(dispute);
}, { permission: "collections.create_dispute" });
