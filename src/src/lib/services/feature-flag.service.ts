import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/events/audit";
import { logSecurityEvent } from "@/lib/events/security";
import { invalidateFlagCache } from "@/lib/feature-flags/evaluate";
import type { Actor } from "@/lib/events/audit-helpers";
import type { FlagState, FlagLevel } from "@prisma/client";

export interface CreateFlagInput {
  code: string;
  name: string;
  description?: string;
  category?: string;
  defaultState: FlagState;
}

export async function createFlag(input: CreateFlagInput, actor: Actor) {
  const flag = await prisma.featureFlag.create({ data: input });
  await createAuditEvent({
    actorId: actor.id, actorName: actor.name, action: "feature_flag.created",
    entityType: "FeatureFlag", entityId: flag.id, entityName: flag.name,
  });
  return flag;
}

export async function updateFlag(flagId: string, input: Partial<CreateFlagInput>, actor: Actor) {
  const flag = await prisma.featureFlag.update({ where: { id: flagId }, data: input });
  await invalidateFlagCache();
  await logSecurityEvent({
    type: "FEATURE_FLAG_CHANGE", actorId: actor.id,
    details: { flagId, flagCode: flag.code, changes: input } as Record<string, unknown>,
    success: true,
  });
  return flag;
}

export async function createAssignment(
  flagId: string, level: FlagLevel, targetId: string, state: FlagState, actor: Actor,
) {
  const assignment = await prisma.featureFlagAssignment.upsert({
    where: { flagId_level_targetId: { flagId, level, targetId } },
    update: { state },
    create: { flagId, level, targetId, state, createdBy: actor.id },
  });
  await invalidateFlagCache();
  await logSecurityEvent({
    type: "FEATURE_FLAG_CHANGE", actorId: actor.id,
    details: { flagId, level, targetId, state } as Record<string, unknown>,
    success: true,
  });
  return assignment;
}

export async function deleteAssignment(assignmentId: string, actor: Actor) {
  const assignment = await prisma.featureFlagAssignment.delete({ where: { id: assignmentId } });
  await invalidateFlagCache();
  await logSecurityEvent({
    type: "FEATURE_FLAG_CHANGE", actorId: actor.id,
    details: { action: "removed", flagId: assignment.flagId } as Record<string, unknown>,
    success: true,
  });
}

export async function listFlags() {
  return prisma.featureFlag.findMany({
    include: { _count: { select: { assignments: true } } },
    orderBy: [{ category: "asc" }, { code: "asc" }],
  });
}

export async function getFlagById(flagId: string) {
  return prisma.featureFlag.findUnique({
    where: { id: flagId },
    include: { assignments: { orderBy: { level: "asc" } } },
  });
}
