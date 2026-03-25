import { NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth/helpers";
import type { SessionUser } from "@/lib/auth/options";
import { handleApiError } from "./error-handler";
import { checkRateLimit, RATE_LIMITS } from "./rate-limit";

type RouteHandler = (
  request: Request,
  context: { params?: Record<string, string>; user: SessionUser },
) => Promise<NextResponse>;

interface HandlerOptions {
  /** Permission code required to access this endpoint */
  permission?: string;
  /** Rate limit config key */
  rateLimit?: keyof typeof RATE_LIMITS;
}

/** Wrap an API route handler with auth, RBAC, rate limiting, and error handling */
export function apiHandler(handler: RouteHandler, options: HandlerOptions = {}) {
  return async (request: Request, context?: { params?: Promise<Record<string, string>> }) => {
    try {
      // 1. Auth check
      const user = options.permission
        ? await requirePermission(options.permission)
        : await requireAuth();

      // 2. Rate limiting
      if (options.rateLimit) {
        const result = await checkRateLimit(user.id, RATE_LIMITS[options.rateLimit]);
        if (!result.allowed && result.response) return result.response;
      }

      // 3. Resolve params
      const params = context?.params ? await context.params : undefined;

      // 4. Execute handler
      return await handler(request, { params, user });
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/** Success response helper */
export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/** Created response helper */
export function createdResponse<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

/** No content response helper */
export function noContentResponse() {
  return new NextResponse(null, { status: 204 });
}
