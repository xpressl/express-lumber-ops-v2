import { apiHandler, jsonResponse, createdResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { assignRole, revokeRole } from "@/lib/services/user.service";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/middleware/error-handler";
import { z } from "zod";

const assignRoleSchema = z.object({
  roleId: z.string().min(1),
  locationId: z.string().optional(),
  reason: z.string().optional(),
});

export const GET = apiHandler(async (_request, { params }) => {
  const userId = params?.["id"];
  if (!userId) throw new NotFoundError("User");

  const assignments = await prisma.userRoleAssignment.findMany({
    where: { userId, revokedAt: null },
    include: { role: true, location: true },
    orderBy: { assignedAt: "desc" },
  });

  return jsonResponse(assignments);
}, { permission: "admin.manage_users" });

export const POST = apiHandler(async (request, { params, user }) => {
  const userId = params?.["id"];
  if (!userId) throw new NotFoundError("User");

  const body = await validateBody(request, assignRoleSchema);
  const assignment = await assignRole(userId, body.roleId, body.locationId ?? null, user.id, body.reason);
  return createdResponse(assignment);
}, { permission: "admin.manage_roles" });
