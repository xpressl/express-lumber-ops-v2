import { apiHandler, jsonResponse, noContentResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { getRoleById, updateRole, deleteRole, assignPermission, removePermission } from "@/lib/services/role.service";
import { NotFoundError } from "@/lib/middleware/error-handler";
import { toActor } from "@/lib/events/audit-helpers";
import { z } from "zod";

const updateRoleSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  department: z.string().max(100).optional(),
});

const permissionActionSchema = z.object({
  action: z.enum(["assign", "remove"]),
  permissionId: z.string().min(1),
  scopeType: z.enum(["ALL", "BRANCH", "OWN", "TEAM", "ASSIGNED", "READ_ONLY"]).optional(),
});

export const GET = apiHandler(async (_request, { params }) => {
  const roleId = params?.["id"];
  if (!roleId) throw new NotFoundError("Role");
  const role = await getRoleById(roleId);
  if (!role) throw new NotFoundError("Role", roleId);
  return jsonResponse(role);
}, { permission: "admin.manage_roles" });

export const PUT = apiHandler(async (request, { params, user }) => {
  const roleId = params?.["id"];
  if (!roleId) throw new NotFoundError("Role");
  const body = await validateBody(request, updateRoleSchema);
  const role = await updateRole(roleId, body, toActor(user));
  return jsonResponse(role);
}, { permission: "admin.manage_roles" });

export const POST = apiHandler(async (request, { params, user }) => {
  const roleId = params?.["id"];
  if (!roleId) throw new NotFoundError("Role");
  const body = await validateBody(request, permissionActionSchema);

  if (body.action === "assign") {
    const rp = await assignPermission(roleId, body.permissionId, body.scopeType ?? "ALL", toActor(user));
    return jsonResponse(rp);
  } else {
    await removePermission(roleId, body.permissionId, toActor(user));
    return noContentResponse();
  }
}, { permission: "admin.manage_roles" });

export const DELETE = apiHandler(async (_request, { params, user }) => {
  const roleId = params?.["id"];
  if (!roleId) throw new NotFoundError("Role");
  await deleteRole(roleId, toActor(user));
  return noContentResponse();
}, { permission: "admin.manage_roles" });
