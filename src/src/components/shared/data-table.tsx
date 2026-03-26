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
import { Search, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";

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
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {onSearch && (
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-9 text-[13px] bg-muted/30 border-border/50 focus:bg-background transition-colors duration-200"
            />
          </div>
        )}
        {toolbar}
        {total !== undefined && (
          <span className="text-[12px] text-muted-foreground/60 font-mono ml-auto tabular-nums">
            {total.toLocaleString()} record{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 overflow-hidden card-warm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-border/40">
              {visibleColumns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(
                    "text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60 h-10 px-4",
                    col.sortable && "cursor-pointer select-none hover:text-foreground transition-colors duration-200",
                    col.className,
                  )}
                  onClick={col.sortable ? () => handleSort(col.id) : undefined}
                >
                  <span className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && sortField === col.id && (
                      sortOrder === "asc"
                        ? <ArrowUp size={12} className="text-primary" />
                        : <ArrowDown size={12} className="text-primary" />
                    )}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: Math.min(limit, 8) }).map((_, i) => (
                <TableRow key={i} className="border-b border-border/20">
                  {visibleColumns.map((col) => (
                    <TableCell key={col.id} className={cn("px-4 py-3", col.className)}>
                      <Skeleton className="h-4 w-full rounded-md" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                    <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center">
                      <Search size={20} className="text-muted-foreground/30" />
                    </div>
                    <span className="text-[13px]">{emptyMessage}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow
                  key={rowKey ? rowKey(row) : i}
                  className={cn(
                    "transition-colors duration-150 border-b border-border/20 last:border-0",
                    onRowClick && "cursor-pointer hover:bg-muted/40",
                    !onRowClick && "hover:bg-muted/20",
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {visibleColumns.map((col) => (
                    <TableCell key={col.id} className={cn("text-[13px] px-4 py-3", col.className)}>
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
        <div className="flex items-center justify-between pt-1">
          <span className="text-[12px] text-muted-foreground/50 font-mono tabular-nums">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
