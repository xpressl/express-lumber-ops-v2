import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { getDispatchBoard, getCarryoverQueue } from "@/lib/services/dispatch.service";

export const GET = apiHandler(async (request) => {
  const url = new URL(request.url);
  const view = url.searchParams.get("view");

  if (view === "carryover") {
    const locationId = url.searchParams.get("locationId") ?? "";
    const data = await getCarryoverQueue(locationId);
    return jsonResponse(data);
  }

  const data = await getDispatchBoard({
    date: url.searchParams.get("date") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    locationId: url.searchParams.get("locationId") ?? undefined,
  });
  return jsonResponse(data);
}, { permission: "dispatch.view_board" });
