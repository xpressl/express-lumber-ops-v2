import { apiHandler, jsonResponse, createdResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { listRoles, createRole } from "@/lib/services/role.service";
import { z } from "zod";

const createRoleSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[A-Z_]+$/),
  displayName: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  department: z.string().max(100).optional(),
});

export const GET = apiHandler(async () => {
  const roles = await listRoles();
  return jsonResponse(roles);
}, { permission: "admin.manage_roles" });

export const POST = apiHandler(async (request, { user }) => {
  const body = await validateBody(request, createRoleSchema);
  const role = await createRole(body, user.id);
  return createdResponse(role);
}, { permission: "admin.manage_roles" });
