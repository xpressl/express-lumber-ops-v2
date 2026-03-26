import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { getImportById, approveImport, rejectImport } from "@/lib/bridge/import-engine";
import { NotFoundError } from "@/lib/middleware/error-handler";
import { z } from "zod";

export const GET = apiHandler(async (_request, { params }) => {
  const id = params?.["id"];
  if (!id) throw new NotFoundError("ImportJob");
  const job = await getImportById(id);
  if (!job) throw new NotFoundError("ImportJob", id);
  return jsonResponse(job);
}, { permission: "imports.view_history" });

const actionSchema = z.object({ action: z.enum(["approve", "reject"]) });

export const POST = apiHandler(async (request, { params, user }) => {
  const id = params?.["id"];
  if (!id) throw new NotFoundError("ImportJob");
  const body = actionSchema.parse(await request.json());
  const job = body.action === "approve" ? await approveImport(id, user.id) : await rejectImport(id, user.id);
  return jsonResponse(job);
}, { permission: "imports.approve_batch" });
