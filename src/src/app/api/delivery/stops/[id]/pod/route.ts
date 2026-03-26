import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { capturePod } from "@/lib/services/delivery.service";
import { capturePodsSchema } from "@/lib/validators/delivery";
import { NotFoundError } from "@/lib/middleware/error-handler";
import { toActor } from "@/lib/events/audit-helpers";

export const POST = apiHandler(async (request, { params, user }) => {
  const stopId = params?.["id"];
  if (!stopId) throw new NotFoundError("RouteStop");
  const body = capturePodsSchema.parse(await request.json());
  const proof = await capturePod(stopId, {
    signatureUrl: body.signatureDataUrl,
    signedBy: body.signedBy,
    photos: body.photos,
    notes: body.notes,
    gpsLat: body.gpsLat,
    gpsLng: body.gpsLng,
  }, toActor(user));
  return jsonResponse(proof);
}, { permission: "delivery.capture_pod" });
