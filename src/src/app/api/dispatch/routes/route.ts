import { apiHandler, jsonResponse, createdResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { createRoute, listRoutes } from "@/lib/services/route.service";
import { createRouteSchema } from "@/lib/validators/dispatch";
import { toActor } from "@/lib/events/audit-helpers";

export const GET = apiHandler(async (request, { scopeFilter }) => {
  const url = new URL(request.url);
  const routes = await listRoutes({
    date: url.searchParams.get("date") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    locationId: url.searchParams.get("locationId") ?? undefined,
    truckId: url.searchParams.get("truckId") ?? undefined,
    driverId: url.searchParams.get("driverId") ?? undefined,
    page: url.searchParams.get("page") ? Number(url.searchParams.get("page")) : undefined,
    limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined,
  });
  return jsonResponse(routes);
}, { permission: "dispatch.view_board" });

export const POST = apiHandler(async (request, { user }) => {
  const body = await validateBody(request, createRouteSchema);
  const route = await createRoute({ ...body, locationId: user.defaultLocationId ?? "" }, toActor(user));
  return createdResponse(route);
}, { permission: "dispatch.assign_truck" });
