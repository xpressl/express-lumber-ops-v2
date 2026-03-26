import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { getAvailableTrucks, listTrucks } from "@/lib/services/truck.service";
import { assignOrdersToTruck } from "@/lib/services/dispatch.service";
import { assignTruckSchema } from "@/lib/validators/dispatch";

export const GET = apiHandler(async (request) => {
  const url = new URL(request.url);
  const locationId = url.searchParams.get("locationId");
  const date = url.searchParams.get("date");

  if (locationId && date) {
    const trucks = await getAvailableTrucks(locationId, new Date(date));
    return jsonResponse(trucks);
  }

  const trucks = await listTrucks(locationId ?? undefined);
  return jsonResponse(trucks);
}, { permission: "dispatch.view_board" });

export const POST = apiHandler(async (request, { user }) => {
  const body = await validateBody(request, assignTruckSchema);
  await assignOrdersToTruck(body.truckId, body.orderIds, user.id, user.defaultLocationId ?? "");
  return jsonResponse({ success: true });
}, { permission: "dispatch.assign_truck" });
