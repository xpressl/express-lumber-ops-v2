import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { getAgingDashboard, getMyAccounts } from "@/lib/services/collections.service";

export const GET = apiHandler(async (request, { user, scopeFilter }) => {
  const url = new URL(request.url);
  const view = url.searchParams.get("view");

  if (view === "my-accounts") {
    const accounts = await getMyAccounts(user.id, scopeFilter);
    return jsonResponse(accounts);
  }

  const locationId = url.searchParams.get("locationId") ?? user.defaultLocationId ?? undefined;
  const data = await getAgingDashboard(locationId, scopeFilter);
  return jsonResponse(data);
}, { permission: "collections.view_aging" });
