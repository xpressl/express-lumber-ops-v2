import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { getVendorById } from "@/lib/services/purchasing.service";
import { NotFoundError } from "@/lib/middleware/error-handler";

export const GET = apiHandler(async (_request, { params, scopeFilter }) => {
  const id = params?.["id"];
  if (!id) throw new NotFoundError("Vendor");
  const vendor = await getVendorById(id, scopeFilter);
  if (!vendor) throw new NotFoundError("Vendor", id);
  return jsonResponse(vendor);
}, { permission: "purchasing.view" });
