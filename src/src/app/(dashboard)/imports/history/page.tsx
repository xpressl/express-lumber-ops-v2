"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";

interface ImportRow {
  id: string;
  type: string;
  fileName: string;
  status: string;
  totalRows: number;
  createdRows: number;
  errorRows: number;
  confidenceScore: number | null;
  createdAt: string;
}

const columns: DataTableColumn<ImportRow>[] = [
  {
    id: "file",
    header: "File",
    cell: (r) => (
      <span className="text-sm truncate max-w-48 block">{r.fileName}</span>
    ),
    sortable: true,
  },
  {
    id: "type",
    header: "Type",
    cell: (r) => (
      <span className="text-[10px] font-mono uppercase">{r.type}</span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (r) => <StatusBadge status={r.status} size="sm" />,
  },
  {
    id: "rows",
    header: "Rows",
    cell: (r) => (
      <span className="font-mono text-xs">{r.totalRows}</span>
    ),
    className: "text-center",
  },
  {
    id: "created",
    header: "Created",
    cell: (r) => (
      <span className="font-mono text-xs text-success">{r.createdRows}</span>
    ),
    className: "text-center",
  },
  {
    id: "errors",
    header: "Errors",
    cell: (r) => (
      <span
        className={`font-mono text-xs ${r.errorRows > 0 ? "text-destructive" : ""}`}
      >
        {r.errorRows}
      </span>
    ),
    className: "text-center",
  },
  {
    id: "confidence",
    header: "Confidence",
    cell: (r) =>
      r.confidenceScore !== null ? (
        <span
          className={`font-mono text-xs ${
            Number(r.confidenceScore) >= 0.85
              ? "text-success"
              : Number(r.confidenceScore) >= 0.7
                ? "text-warning"
                : "text-destructive"
          }`}
        >
          {(Number(r.confidenceScore) * 100).toFixed(0)}%
        </span>
      ) : (
        <span className="text-muted-foreground">{"\u2014"}</span>
      ),
    className: "text-center",
  },
];

export default function ImportHistoryPage() {
  const router = useRouter();
  const [data, setData] = React.useState<ImportRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/imports?status=COMPLETED");
        if (res.ok) setData(await res.json());
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Import History"
        description="Completed imports"
        breadcrumbs={[
          { label: "Imports", href: "/imports" },
          { label: "History" },
        ]}
      />

      <DataTable
        columns={columns}
        data={data}
        total={data.length}
        isLoading={isLoading}
        searchPlaceholder="Search imports..."
        emptyMessage="No completed imports"
        rowKey={(r) => r.id}
        onRowClick={(r) => router.push(`/imports/${r.id}`)}
      />
    </div>
  );
}
