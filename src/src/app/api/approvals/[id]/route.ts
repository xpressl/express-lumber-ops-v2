import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { approveRequest, denyRequest, cancelRequest } from "@/lib/approvals/engine";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/middleware/error-handler";
import { toActor } from "@/lib/events/audit-helpers";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["approve", "deny", "cancel"]),
  note: z.string().max(500).optional(),
});

export const GET = apiHandler(async (_request, { params }) => {
  const id = params?.["id"];
  if (!id) throw new NotFoundError("ApprovalRequest");
  const request = await prisma.approvalRequest.findUnique({
    where: { id },
    include: { policy: true, requester: { select: { firstName: true, lastName: true, email: true } } },
  });
  if (!request) throw new NotFoundError("ApprovalRequest", id);
  return jsonResponse(request);
});

export const POST = apiHandler(async (request, { params, user }) => {
  const id = params?.["id"];
  if (!id) throw new NotFoundError("ApprovalRequest");
  const body = await validateBody(request, actionSchema);

  let result;
  switch (body.action) {
    case "approve":
      result = await approveRequest(id, toActor(user), body.note);
      break;
    case "deny":
      result = await denyRequest(id, toActor(user), body.note);
      break;
    case "cancel":
      result = await cancelRequest(id, toActor(user));
      break;
  }

  return jsonResponse(result);
});
