import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { getFlagById, updateFlag, createAssignment } from "@/lib/services/feature-flag.service";
import { NotFoundError } from "@/lib/middleware/error-handler";
import { toActor } from "@/lib/events/audit-helpers";
import { z } from "zod";

const updateFlagSchema = z.object({
  name: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  defaultState: z.enum(["ON", "OFF", "BETA", "READ_ONLY", "HIDDEN"]).optional(),
});

const assignmentSchema = z.object({
  level: z.enum(["COMPANY", "BRANCH", "ROLE", "USER", "ENVIRONMENT"]),
  targetId: z.string().min(1),
  state: z.enum(["ON", "OFF", "BETA", "READ_ONLY", "HIDDEN"]),
});

export const GET = apiHandler(async (_request, { params }) => {
  const flagId = params?.["id"];
  if (!flagId) throw new NotFoundError("FeatureFlag");
  const flag = await getFlagById(flagId);
  if (!flag) throw new NotFoundError("FeatureFlag", flagId);
  return jsonResponse(flag);
}, { permission: "admin.manage_feature_flags" });

export const PUT = apiHandler(async (request, { params, user }) => {
  const flagId = params?.["id"];
  if (!flagId) throw new NotFoundError("FeatureFlag");
  const body = await validateBody(request, updateFlagSchema);
  const flag = await updateFlag(flagId, body, toActor(user));
  return jsonResponse(flag);
}, { permission: "admin.manage_feature_flags" });

export const POST = apiHandler(async (request, { params, user }) => {
  const flagId = params?.["id"];
  if (!flagId) throw new NotFoundError("FeatureFlag");
  const body = await validateBody(request, assignmentSchema);
  const assignment = await createAssignment(flagId, body.level, body.targetId, body.state, toActor(user));
  return jsonResponse(assignment);
}, { permission: "admin.manage_feature_flags" });
