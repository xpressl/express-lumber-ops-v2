import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { getReceivingById, completeReceiving } from "@/lib/services/receiving.service";
import { NotFoundError } from "@/lib/middleware/error-handler";
import { toActor } from "@/lib/events/audit-helpers";

export const GET = apiHandler(async (_request, { params, scopeFilter }) => {
  const id = params?.["id"];
  if (!id) throw new NotFoundError("ReceivingRecord");
  const record = await getReceivingById(id, scopeFilter);
  if (!record) throw new NotFoundError("ReceivingRecord", id);
  return jsonResponse(record);
}, { permission: "receiving.view" });

export const POST = apiHandler(async (_request, { params, user }) => {
  const id = params?.["id"];
  if (!id) throw new NotFoundError("ReceivingRecord");
  const record = await completeReceiving(id, toActor(user));
  return jsonResponse(record);
}, { permission: "receiving.receive_po" });
