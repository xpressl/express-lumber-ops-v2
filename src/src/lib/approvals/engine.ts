import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/events/audit";
import type { Actor } from "@/lib/events/audit-helpers";
import type { ApprovalStatus } from "@prisma/client";

export interface RequestApprovalInput {
  policyId: string;
  requester: Actor;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  reason: string;
  attachmentIds?: string[];
  locationId: string;
}

/** Create a new approval request */
export async function requestApproval(input: RequestApprovalInput) {
  const policy = await prisma.approvalPolicy.findUnique({ where: { id: input.policyId } });
  if (!policy) throw new Error(`Approval policy not found: ${input.policyId}`);
  if (!policy.isActive) throw new Error(`Approval policy is inactive: ${policy.name}`);

  const expiresAt = new Date(Date.now() + policy.timeoutHours * 60 * 60 * 1000);

  const request = await prisma.approvalRequest.create({
    data: {
      policyId: input.policyId,
      requesterId: input.requester.id,
      entityType: input.entityType,
      entityId: input.entityId,
      status: "PENDING",
      oldValue: (input.oldValue as Prisma.InputJsonValue) ?? undefined,
      newValue: (input.newValue as Prisma.InputJsonValue) ?? undefined,
      reason: input.reason,
      attachmentIds: input.attachmentIds ?? [],
      locationId: input.locationId,
      expiresAt,
    },
  });

  await createAuditEvent({
    actorId: input.requester.id,
    actorName: input.requester.name,
    action: "approval.requested",
    entityType: input.entityType,
    entityId: input.entityId,
    locationId: input.locationId,
    metadata: { approvalRequestId: request.id, policyName: policy.name },
  });

  return request;
}

/** Approve a request */
export async function approveRequest(requestId: string, approver: Actor, note?: string) {
  return resolveRequest(requestId, approver, "APPROVED", note);
}

/** Deny a request */
export async function denyRequest(requestId: string, approver: Actor, note?: string) {
  return resolveRequest(requestId, approver, "DENIED", note);
}

/** Cancel a request (by requester) */
export async function cancelRequest(requestId: string, requester: Actor) {
  const request = await prisma.approvalRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Approval request not found");
  if (request.requesterId !== requester.id) throw new Error("Only the requester can cancel");
  if (request.status !== "PENDING") throw new Error(`Cannot cancel request in status: ${request.status}`);

  return prisma.approvalRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED", resolvedAt: new Date(), resolvedBy: requester.id },
  });
}

/** Find the matching approval policy for an action */
export async function findPolicy(actionType: string, locationId?: string) {
  return prisma.approvalPolicy.findFirst({
    where: {
      actionType,
      isActive: true,
      OR: [{ locationId: null }, ...(locationId ? [{ locationId }] : [])],
    },
    orderBy: { locationId: "desc" }, // prefer location-specific over global
  });
}

/** Check if an action requires approval based on thresholds */
export async function requiresApproval(
  actionType: string,
  value?: number,
  locationId?: string,
): Promise<{ required: boolean; policyId?: string }> {
  const policy = await findPolicy(actionType, locationId);
  if (!policy) return { required: false };

  if (policy.thresholdMin !== null || policy.thresholdMax !== null) {
    if (value === undefined) return { required: true, policyId: policy.id };
    const min = policy.thresholdMin ? Number(policy.thresholdMin) : -Infinity;
    const max = policy.thresholdMax ? Number(policy.thresholdMax) : Infinity;
    if (value >= min && value <= max) return { required: true, policyId: policy.id };
    return { required: false };
  }

  return { required: true, policyId: policy.id };
}

/** Get pending approval requests for an approver */
export async function getPendingForApprover(approverRoles: string[], locationId?: string) {
  const policies = await prisma.approvalPolicy.findMany({
    where: { isActive: true, approverRoles: { hasSome: approverRoles } },
  });
  const policyIds = policies.map((p) => p.id);

  return prisma.approvalRequest.findMany({
    where: {
      policyId: { in: policyIds },
      status: "PENDING",
      ...(locationId ? { locationId } : {}),
    },
    include: { policy: true, requester: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/** Internal: resolve a request */
async function resolveRequest(requestId: string, resolver: Actor, status: ApprovalStatus, note?: string) {
  const request = await prisma.approvalRequest.findUnique({
    where: { id: requestId },
    include: { policy: true },
  });
  if (!request) throw new Error("Approval request not found");
  if (request.status !== "PENDING") throw new Error(`Cannot resolve request in status: ${request.status}`);

  // Verify the resolver has one of the required approver roles
  const resolverRoles = await prisma.userRoleAssignment.findMany({
    where: { userId: resolver.id, revokedAt: null },
    include: { role: true },
  });
  const resolverRoleNames = resolverRoles.map((ra: { role: { name: string } }) => ra.role.name);
  const hasApproverRole = request.policy.approverRoles.some((r) => resolverRoleNames.includes(r));
  if (!hasApproverRole) {
    throw new Error("Resolver does not have a required approver role for this policy");
  }

  const updated = await prisma.approvalRequest.update({
    where: { id: requestId },
    data: { status, resolvedAt: new Date(), resolvedBy: resolver.id, resolutionNote: note },
  });

  await createAuditEvent({
    actorId: resolver.id,
    actorName: resolver.name,
    action: `approval.${status.toLowerCase()}`,
    entityType: request.entityType,
    entityId: request.entityId,
    locationId: request.locationId,
    metadata: { approvalRequestId: requestId, policyName: request.policy.name, note },
  });

  return updated;
}
