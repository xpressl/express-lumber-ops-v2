import { apiHandler, jsonResponse, createdResponse } from "@/lib/middleware/api-handler";
import { listLeads, createLead } from "@/lib/services/crm.service";
import { createLeadSchema } from "@/lib/validators/crm";
import { toActor } from "@/lib/events/audit-helpers";

export const GET = apiHandler(async (request, { user, scopeFilter }) => {
  const url = new URL(request.url);
  const leads = await listLeads({
    status: url.searchParams.get("status") ?? undefined,
    assignedTo: url.searchParams.get("assignedTo") ?? undefined,
    locationId: url.searchParams.get("locationId") ?? user.defaultLocationId ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    page: url.searchParams.get("page") ? Number(url.searchParams.get("page")) : undefined,
    limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined,
  });
  return jsonResponse(leads);
}, { permission: "crm.view_leads" });

export const POST = apiHandler(async (request, { user }) => {
  const body = createLeadSchema.parse(await request.json());
  const lead = await createLead(body, toActor(user));
  return createdResponse(lead);
}, { permission: "crm.create_lead" });
