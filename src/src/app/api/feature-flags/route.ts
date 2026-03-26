import { apiHandler, jsonResponse, createdResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { listFlags, createFlag } from "@/lib/services/feature-flag.service";
import { toActor } from "@/lib/events/audit-helpers";
import { z } from "zod";

const createFlagSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  defaultState: z.enum(["ON", "OFF", "BETA", "READ_ONLY", "HIDDEN"]),
});

export const GET = apiHandler(async () => {
  const flags = await listFlags();
  return jsonResponse(flags);
}, { permission: "admin.manage_feature_flags" });

export const POST = apiHandler(async (request, { user }) => {
  const body = await validateBody(request, createFlagSchema);
  const flag = await createFlag(body, toActor(user));
  return createdResponse(flag);
}, { permission: "admin.manage_feature_flags" });
