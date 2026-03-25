"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Column definition for DataTable */
export interface DataTableColumn<T> {
  id: string;
  header: string;
  accessorFn?: (row: T) => unknown;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  hidden?: boolean;
}

/** DataTable props */
interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (query: string) => void;
  onSort?: (field: string, order: "asc" | "desc") => void;
  searchPlaceholder?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  rowKey?: (row: T) => string;
  onRowClick?: (row: T) => void;
  toolbar?: React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  total,
  page = 1,
  limit = 20,
  totalPages = 1,
  onPageChange,
  onSearch,
  onSort,
  searchPlaceholder = "Search...",
  isLoading = false,
  emptyMessage = "No results found",
  className,
  rowKey,
  onRowClick,
  toolbar,
}: DataTableProps<T>) {
  const [searchValue, setSearchValue] = React.useState("");
  const [sortField, setSortField] = React.useState<string | null>(null);
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  const visibleColumns = columns.filter((col) => !col.hidden);

  function handleSearch(value: string) {
    setSearchValue(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      onSearch?.(value);
    }, 300);
  }

  function handleSort(field: string) {
    const newOrder = sortField === field && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(newOrder);
    onSort?.(field, newOrder);
  }

  function getCellValue(row: T, col: DataTableColumn<T>): React.ReactNode {
    if (col.cell) return col.cell(row);
    if (col.accessorFn) {
      const value = col.accessorFn(row);
      if (value === null || value === undefined) return "—";
      return String(value);
    }
    return "—";
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {onSearch && (
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-xs h-9 font-mono text-sm bg-muted/50"
          />
        )}
        {toolbar}
        {total !== undefined && (
          <span className="text-xs text-muted-foreground font-mono ml-auto">
            {total.toLocaleString()} record{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {visibleColumns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(
                    "text-xs font-mono uppercase tracking-wider text-muted-foreground h-9",
                    col.sortable && "cursor-pointer select-none hover:text-foreground transition-colors",
                    col.className,
                  )}
                  onClick={col.sortable ? () => handleSort(col.id) : undefined}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortField === col.id && (
                      <span className="text-primary">{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: limit }).map((_, i) => (
                <TableRow key={i}>
                  {visibleColumns.map((col) => (
                    <TableCell key={col.id} className={col.className}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-32 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow
                  key={rowKey ? rowKey(row) : i}
                  className={cn(
                    "transition-colors",
                    onRowClick && "cursor-pointer hover:bg-muted/50",
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {visibleColumns.map((col) => (
                    <TableCell key={col.id} className={cn("text-sm", col.className)}>
                      {getCellValue(row, col)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="h-7 px-2 text-xs font-mono"
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="h-7 px-2 text-xs font-mono"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
