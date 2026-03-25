import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/helpers";

/** Standard API error codes */
export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

/** Standard error response shape */
export interface ErrorResponse {
  error: string;
  code: ErrorCode;
  details?: Record<string, unknown>;
}

/** Create a standard error response */
export function errorResponse(status: number, code: ErrorCode, message: string, details?: Record<string, unknown>) {
  const body: ErrorResponse = { error: message, code };
  if (details) body.details = details;
  return NextResponse.json(body, { status });
}

/** Handle errors from API route handlers */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return errorResponse(error.status, error.code, error.message);
  }

  if (error instanceof ValidationError) {
    return errorResponse(400, "VALIDATION_ERROR", error.message, error.details);
  }

  if (error instanceof NotFoundError) {
    return errorResponse(404, "NOT_FOUND", error.message);
  }

  if (error instanceof ConflictError) {
    return errorResponse(409, "CONFLICT", error.message);
  }

  // Unknown error
  console.error("[API Error]", error);
  return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred");
}

/** Validation error with field details */
export class ValidationError extends Error {
  details: Record<string, unknown>;
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

/** Not found error */
export class NotFoundError extends Error {
  constructor(entity: string, id?: string) {
    super(id ? `${entity} not found: ${id}` : `${entity} not found`);
    this.name = "NotFoundError";
  }
}

/** Conflict error (duplicate, state conflict) */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}
