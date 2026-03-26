import { apiHandler, jsonResponse, noContentResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { getUserById, updateUser, deleteUser } from "@/lib/services/user.service";
import { NotFoundError } from "@/lib/middleware/error-handler";
import { z } from "zod";

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  defaultLocationId: z.string().optional(),
});

export const GET = apiHandler(async (_request, { params }) => {
  const userId = params?.["id"];
  if (!userId) throw new NotFoundError("User");
  const user = await getUserById(userId);
  if (!user) throw new NotFoundError("User", userId);
  return jsonResponse(user);
}, { permission: "admin.manage_users" });

export const PUT = apiHandler(async (request, { params, user }) => {
  const userId = params?.["id"];
  if (!userId) throw new NotFoundError("User");
  const body = await validateBody(request, updateUserSchema);
  const updated = await updateUser(userId, body, user.id);
  return jsonResponse(updated);
}, { permission: "admin.manage_users" });

export const DELETE = apiHandler(async (_request, { params, user }) => {
  const userId = params?.["id"];
  if (!userId) throw new NotFoundError("User");
  await deleteUser(userId, user.id);
  return noContentResponse();
}, { permission: "admin.manage_users" });
