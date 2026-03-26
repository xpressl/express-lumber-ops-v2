"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";

interface AuditRow {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string | null;
  source: string;
  timestamp: string;
}

const columns: DataTableColumn<AuditRow>[] = [
  { id: "action", header: "Action", cell: (r) => <span className="font-mono text-xs">{r.action}</span>, sortable: true },
  { id: "actor", header: "Actor", accessorFn: (r) => r.actorName },
  { id: "entity", header: "Entity", cell: (r) => (
    <span className="text-xs"><span className="font-mono text-muted-foreground">{r.entityType}</span> {r.entityName ?? r.entityId.slice(0, 8)}</span>
  )},
  { id: "source", header: "Source", accessorFn: (r) => r.source, className: "font-mono text-xs" },
  { id: "time", header: "When", cell: (r) => formatDistanceToNow(new Date(r.timestamp), { addSuffix: true }), className: "text-xs", sortable: true },
];

export default function AuditLogPage() {
  const [data, setData] = React.useState<AuditRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchAudit = React.useCallback(async (p = 1, action?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "30" });
      if (action) params.set("action", action);
      const res = await fetch(`/api/audit?${params}`);
      if (res.ok) { const json = await res.json(); setData(json.data); setTotal(json.total); }
    } finally { setIsLoading(false); }
  }, []);

  React.useEffect(() => { void fetchAudit(); }, [fetchAudit]);

  return (
    <div className="space-y-8">
      <PageHeader title="Audit Log" description="Complete history of system actions"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Audit Log" }]} />
      <DataTable columns={columns} data={data} total={total} page={page} totalPages={Math.ceil(total / 30)}
        onPageChange={(p) => { setPage(p); void fetchAudit(p); }}
        onSearch={(q) => void fetchAudit(1, q)} searchPlaceholder="Filter by action..."
        isLoading={isLoading} emptyMessage="No audit events" rowKey={(r) => r.id} />
    </div>
  );
}
