import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { validateBody } from "@/lib/middleware/validate";
import { getRouteById, releaseRoute, reorderStops } from "@/lib/services/route.service";
import { validateDispatchChecklist } from "@/lib/services/dispatch.service";
import { reorderStopsSchema } from "@/lib/validators/dispatch";
import { NotFoundError } from "@/lib/middleware/error-handler";

export const GET = apiHandler(async (_request, { params }) => {
  const id = params?.["id"];
  if (!id) throw new NotFoundError("Route");
  const route = await getRouteById(id);
  if (!route) throw new NotFoundError("Route", id);
  return jsonResponse(route);
}, { permission: "dispatch.view_board" });

export const POST = apiHandler(async (request, { params, user }) => {
  const id = params?.["id"];
  if (!id) throw new NotFoundError("Route");

  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "release") {
    const checklist = await validateDispatchChecklist(id);
    if (!checklist.valid) {
      return jsonResponse({ success: false, issues: checklist.issues }, 400);
    }
    const route = await releaseRoute(id, user.id);
    return jsonResponse(route);
  }

  if (action === "reorder") {
    const body = await validateBody(request, reorderStopsSchema);
    await reorderStops(id, body.stopIds, user.id);
    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: "Unknown action" }, 400);
}, { permission: "dispatch.release_route" });
