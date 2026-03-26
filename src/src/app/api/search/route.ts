import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { search } from "@/lib/services/search.service";

export const GET = apiHandler(async (request, { scopeFilter }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const results = await search(q, scopeFilter);
  return jsonResponse(results);
}, { permission: "search.global" });
