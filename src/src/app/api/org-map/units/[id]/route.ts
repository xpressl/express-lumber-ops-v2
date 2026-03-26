import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { getUnitDetail, updateOrgUnit } from "@/lib/services/org-unit.service";
import { NotFoundError } from "@/lib/middleware/error-handler";
import { z } from "zod";

const updateUnitSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  type: z.enum(["COMPANY", "REGION", "BRANCH", "DEPARTMENT", "TEAM"]).optional(),
  parentId: z.string().optional(),
  description: z.string().optional(),
  headId: z.string().optional(),
  locationId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]).optional(),
});

export const GET = apiHandler(async (_request, { params, scopeFilter }) => {
  const id = params?.["id"];
  if (!id) throw new NotFoundError("OrgUnit");
  const unit = await getUnitDetail(id, scopeFilter);
  if (!unit) throw new NotFoundError("OrgUnit", id);
  return jsonResponse(unit);
}, { permission: "admin.manage_users" });

export const PUT = apiHandler(async (request, { params, scopeFilter }) => {
  const id = params?.["id"];
  if (!id) throw new NotFoundError("OrgUnit");
  const body = await validateBody(request, updateUnitSchema);
  const updated = await updateOrgUnit(id, body, scopeFilter);
  return jsonResponse(updated);
}, { permission: "admin.manage_users" });
