/** Pagination parameters parsed from URL */
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/** Standard paginated response shape */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Parse pagination from URL search params */
export function parsePagination(url: URL, defaultLimit = 20, maxLimit = 100): PaginationParams {
  const pageStr = url.searchParams.get("page");
  const limitStr = url.searchParams.get("limit");

  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(limitStr ?? String(defaultLimit), 10) || defaultLimit));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/** Build a paginated response from data and total count */
export function paginatedResponse<T>(data: T[], total: number, params: PaginationParams): PaginatedResponse<T> {
  return {
    data,
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit),
  };
}

/** Parse sort parameters from URL */
export function parseSort(url: URL, allowedFields: string[], defaultField = "createdAt", defaultOrder: "asc" | "desc" = "desc") {
  const sortBy = url.searchParams.get("sortBy") ?? defaultField;
  const sortOrder = (url.searchParams.get("sortOrder") ?? defaultOrder) as "asc" | "desc";

  // Validate sort field against allowed list
  const validField = allowedFields.includes(sortBy) ? sortBy : defaultField;
  const validOrder = sortOrder === "asc" || sortOrder === "desc" ? sortOrder : defaultOrder;

  return { [validField]: validOrder };
}
