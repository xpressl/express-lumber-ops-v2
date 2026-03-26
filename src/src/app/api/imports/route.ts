import { apiHandler, jsonResponse, createdResponse } from "@/lib/middleware/api-handler";
import { listImports, createImportJob } from "@/lib/bridge/import-engine";
import { uploadImportSchema } from "@/lib/validators/import";
import { toActor } from "@/lib/events/audit-helpers";

export const GET = apiHandler(async (request, { user, scopeFilter }) => {
  const url = new URL(request.url);
  const imports = await listImports({
    type: url.searchParams.get("type") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    locationId: url.searchParams.get("locationId") ?? user.defaultLocationId ?? undefined,
    scopeFilter,
  });
  return jsonResponse(imports);
}, { permission: "imports.view_history" });

export const POST = apiHandler(async (request, { user }) => {
  const body = uploadImportSchema.parse(await request.json());
  const job = await createImportJob(body, toActor(user));
  return createdResponse(job);
}, { permission: "imports.upload" });
