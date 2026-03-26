import { apiHandler, jsonResponse, createdResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { parsePagination, paginatedResponse } from "@/lib/middleware/pagination";
import { requestApproval, getPendingForApprover } from "@/lib/approvals/engine";
import { toActor } from "@/lib/events/audit-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const requestApprovalSchema = z.object({
  policyId: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  reason: z.string().min(1),
  oldValue: z.record(z.string(), z.unknown()).optional(),
  newValue: z.record(z.string(), z.unknown()).optional(),
  attachmentIds: z.array(z.string()).optional(),
  locationId: z.string().min(1),
});

export const GET = apiHandler(async (request, { user }) => {
  const url = new URL(request.url);
  const pagination = parsePagination(url);
  const status = url.searchParams.get("status");

  if (status === "pending" && user.roles.length > 0) {
    const pending = await getPendingForApprover(user.roles, user.defaultLocationId ?? undefined);
    return jsonResponse(pending);
  }

  const where: Record<string, unknown> = {};
  if (status) where["status"] = status.toUpperCase();
  const locationId = url.searchParams.get("locationId");
  if (locationId) where["locationId"] = locationId;

  const [data, total] = await Promise.all([
    prisma.approvalRequest.findMany({
      where, include: { policy: true, requester: { select: { firstName: true, lastName: true } } },
      skip: pagination.skip, take: pagination.limit, orderBy: { createdAt: "desc" },
    }),
    prisma.approvalRequest.count({ where }),
  ]);

  return jsonResponse(paginatedResponse(data, total, pagination));
});

export const POST = apiHandler(async (request, { user }) => {
  const body = await validateBody(request, requestApprovalSchema);
  const result = await requestApproval({ ...body, requester: toActor(user) });
  return createdResponse(result);
});
