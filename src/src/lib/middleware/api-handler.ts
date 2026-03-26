import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import type { SessionUser } from "@/lib/auth/options";
import { canAccess } from "@/lib/permissions/evaluate";
import { AuthError } from "@/lib/auth/helpers";
import { handleApiError } from "./error-handler";
import { checkRateLimit, RATE_LIMITS } from "./rate-limit";
import { buildScopeFilter } from "./scope-filter";

type RouteHandler = (
  request: Request,
  context: {
    params?: Record<string, string>;
    user: SessionUser;
    /** Pre-built scope filter for Prisma where-clauses */
    scopeFilter: Record<string, unknown>;
  },
) => Promise<NextResponse>;

interface HandlerOptions {
  /** Permission code required to access this endpoint */
  permission?: string;
  /** Rate limit config key */
  rateLimit?: keyof typeof RATE_LIMITS;
}

/** Wrap an API route handler with auth, RBAC, rate limiting, scope, and error handling */
export function apiHandler(handler: RouteHandler, options: HandlerOptions = {}) {
  return async (request: Request, context?: { params?: Promise<Record<string, string>> }) => {
    try {
      // 1. Auth check
      const user = await requireAuth();

      // 2. Live permission check (from DB/cache, not stale JWT)
      if (options.permission) {
        const allowed = await canAccess(user.id, options.permission);
        if (!allowed) {
          throw new AuthError("FORBIDDEN", `Missing permission: ${options.permission}`);
        }
      }

      // 3. Rate limiting
      if (options.rateLimit) {
        const result = await checkRateLimit(user.id, RATE_LIMITS[options.rateLimit]);
        if (!result.allowed && result.response) return result.response;
      }

      // 4. Resolve params
      const params = context?.params ? await context.params : undefined;

      // 5. Build scope filter for this permission
      const scopeFilter = options.permission
        ? await buildScopeFilter(user, options.permission)
        : {};

      // 6. Execute handler
      return await handler(request, { params, user, scopeFilter });
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
