import { apiHandler, jsonResponse, createdResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { getOrgTree, getOrgStats, createOrgUnit } from "@/lib/services/org-unit.service";
import { z } from "zod";

const createUnitSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  type: z.enum(["COMPANY", "REGION", "BRANCH", "DEPARTMENT", "TEAM"]),
  parentId: z.string().optional(),
  description: z.string().optional(),
  headId: z.string().optional(),
  locationId: z.string().optional(),
});

export const GET = apiHandler(async (request, { scopeFilter }) => {
  const url = new URL(request.url);
  const view = url.searchParams.get("view");

  if (view === "stats") {
    const stats = await getOrgStats(scopeFilter);
    return jsonResponse(stats);
  }

  const result = await getOrgTree({
    type: url.searchParams.get("type") ?? undefined,
    locationId: url.searchParams.get("locationId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  }, scopeFilter);
  return jsonResponse(result);
}, { permission: "admin.manage_users" });

export const POST = apiHandler(async (request, { user }) => {
  const body = await validateBody(request, createUnitSchema);
  const unit = await createOrgUnit(body, user.id);
  return createdResponse(unit);
}, { permission: "admin.manage_users" });
