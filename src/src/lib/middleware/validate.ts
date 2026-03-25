import type { z } from "zod";
import { ValidationError } from "./error-handler";

/** Validate request body against a Zod schema */
export async function validateBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError("Invalid JSON body");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    throw new ValidationError("Validation failed", fieldErrors);
  }

  return result.data;
}

/** Validate query params against a Zod schema */
export function validateQuery<T extends z.ZodType>(url: URL, schema: T): z.infer<T> {
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    throw new ValidationError("Invalid query parameters", fieldErrors);
  }

  return result.data;
}
