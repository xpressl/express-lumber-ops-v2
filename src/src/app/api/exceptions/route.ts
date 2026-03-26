import { z } from "zod";
import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { prisma } from "@/lib/prisma";
import { getExceptionSummary } from "@/lib/exceptions/engine";
import { parsePagination, paginatedResponse } from "@/lib/middleware/pagination";

const exceptionStatusEnum = z.enum(["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "ESCALATED"]);
const severityEnum = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);

export const GET = apiHandler(async (request, { user, scopeFilter }) => {
  const url = new URL(request.url);
  const view = url.searchParams.get("view");
  const locationId = url.searchParams.get("locationId") ?? user.defaultLocationId ?? undefined;

  if (view === "summary") {
    const summary = await getExceptionSummary(locationId, scopeFilter);
    return jsonResponse(summary);
  }

  const pagination = parsePagination(url);
  const statusParam = url.searchParams.get("status");
  const severityParam = url.searchParams.get("severity");

  const parsedStatus = statusParam ? exceptionStatusEnum.safeParse(statusParam) : null;
  const parsedSeverity = severityParam ? severityEnum.safeParse(severityParam) : null;

  const exceptions = await prisma.exception.findMany({
    where: {
      ...scopeFilter,
      ...(locationId ? { locationId } : {}),
      ...(parsedStatus?.success ? { status: parsedStatus.data } : {
        status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "ESCALATED"] },
      }),
      ...(url.searchParams.get("category") ? { category: url.searchParams.get("category")! } : {}),
      ...(parsedSeverity?.success ? { severity: parsedSeverity.data } : {}),
    },
    orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
    skip: (pagination.page - 1) * pagination.limit,
    take: pagination.limit,
  });

  const total = await prisma.exception.count({
    where: {
      ...scopeFilter,
      ...(locationId ? { locationId } : {}),
      ...(parsedStatus?.success ? { status: parsedStatus.data } : {
        status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "ESCALATED"] },
      }),
    },
  });

  return jsonResponse(paginatedResponse(exceptions, total, pagination));
}, { permission: "exceptions.view" });
