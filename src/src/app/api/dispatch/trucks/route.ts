import { NextResponse } from "next/server";
import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { getAvailableTrucks, listTrucks } from "@/lib/services/truck.service";
import { assignOrdersToTruck } from "@/lib/services/dispatch.service";
import { assignTruckSchema } from "@/lib/validators/dispatch";
import { toActor } from "@/lib/events/audit-helpers";

export const GET = apiHandler(async (request, { scopeFilter }) => {
  const url = new URL(request.url);
  const locationId = url.searchParams.get("locationId");
  const date = url.searchParams.get("date");

  if (locationId && date) {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: "Invalid date parameter" }, { status: 400 });
    }
    const trucks = await getAvailableTrucks(locationId, dateObj, scopeFilter);
    return jsonResponse(trucks);
  }

  const trucks = await listTrucks(locationId ?? undefined, scopeFilter);
  return jsonResponse(trucks);
}, { permission: "dispatch.view_board" });

export const POST = apiHandler(async (request, { user }) => {
  const body = await validateBody(request, assignTruckSchema);
  await assignOrdersToTruck(body.truckId, body.orderIds, toActor(user), user.defaultLocationId ?? "");
  return jsonResponse({ success: true });
}, { permission: "dispatch.assign_truck" });
