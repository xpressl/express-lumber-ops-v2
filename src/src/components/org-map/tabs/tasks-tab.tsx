"use client";

import * as React from "react";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/states";

interface TaskRow {
  id: string;
  name: string;
  category: string;
  processArea: string;
  frequency: string;
  riskLevel: string;
  isCritical: boolean;
  status: string;
  assignments: {
    assignmentType: string;
    roleTemplate: { title: string } | null;
    user: { firstName: string; lastName: string } | null;
  }[];
}

interface TaskDetail {
  id: string;
  name: string;
  category: string;
  processArea: string;
  description: string | null;
  frequency: string;
  riskLevel: string;
  isCritical: boolean;
  linkedModule: string | null;
  linkedSopUrl: string | null;
  status: string;
  assignments: {
    id: string;
    assignmentType: string;
    isPrimary: boolean;
    isTemporary: boolean;
    notes: string | null;
    roleTemplate: { id: string; title: string } | null;
    user: { id: string; firstName: string; lastName: string } | null;
    location: { name: string } | null;
  }[];
  permissionReqs: { permissionCode: string }[];
  coverageGaps: { gapType: string; severity: string; summary: string }[];
}

const columns: DataTableColumn<TaskRow>[] = [
  {
    id: "name",
    header: "Task",
    cell: (row) => (
      <div className="flex items-center gap-1.5">
        {row.isCritical && <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />}
        <span className="font-medium">{row.name}</span>
      </div>
    ),
    sortable: true,
  },
  {
    id: "category",
    header: "Department",
    cell: (row) => <span className="text-xs font-mono">{row.category}</span>,
    sortable: true,
  },
  {
    id: "frequency",
    header: "Freq",
    cell: (row) => <span className="text-[10px] font-mono text-muted-foreground">{row.frequency}</span>,
  },
  {
    id: "risk",
    header: "Risk",
    cell: (row) => <StatusBadge status={row.riskLevel} size="sm" />,
  },
  {
    id: "owners",
    header: "Owners",
    cell: (row) => {
      const responsible = row.assignments.filter((a) => a.assignmentType === "RESPONSIBLE");
      if (responsible.length === 0) return <span className="text-[10px] text-destructive italic">Unassigned</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {responsible.map((a, i) => (
            <span key={i} className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
              {a.roleTemplate?.title ?? (a.user ? `${a.user.firstName} ${a.user.lastName}` : "?")}
            </span>
          ))}
        </div>
      );
    },
  },
  {
    id: "backup",
    header: "Backup",
    cell: (row) => {
      const backups = row.assignments.filter((a) => a.assignmentType === "BACKUP");
      if (backups.length === 0) return <span className="text-[10px] text-warning italic">None</span>;
      return (
        <span className="text-[10px] font-mono text-info">
          {backups.map((a) => a.roleTemplate?.title ?? "Direct").join(", ")}
        </span>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} size="sm" />,
  },
];

export function TasksTab() {
  const [tasks, setTasks] = React.useState<TaskRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<TaskDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [filterCritical, setFilterCritical] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [detailError, setDetailError] = React.useState<string | null>(null);

  const fetchTasks = React.useCallback(async (p = 1, search?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "25" });
      if (search) params.set("search", search);
      if (filterCritical) params.set("isCritical", "true");
      const res = await fetch(`/api/org-map/tasks?${params}`);
      if (!res.ok) { setError("Failed to load tasks"); return; }
      const json = await res.json();
      setTasks(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch {
      setError("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, [filterCritical]);

  React.useEffect(() => { void fetchTasks(); }, [fetchTasks]);

  React.useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    setDetailLoading(true);
    setDetailError(null);
    fetch(`/api/org-map/tasks/${selectedId}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject("Failed")))
      .then((d) => setDetail(d))
      .catch((e) => {
        if (e !== "AbortError" && e?.name !== "AbortError")
          setDetailError("Failed to load task details");
      })
      .finally(() => setDetailLoading(false));
    return () => controller.abort();
  }, [selectedId]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs font-mono cursor-pointer">
          <input
            type="checkbox"
            checked={filterCritical}
            onChange={(e) => setFilterCritical(e.target.checked)}
            className="rounded border-border"
          />
          Critical only
        </label>
      </div>

      {error && <p className="text-sm text-destructive px-4 py-8 text-center">{error}</p>}
      <DataTable
        columns={columns}
        data={tasks}
        total={total}
        page={page}
        totalPages={Math.ceil(total / 25)}
        onPageChange={(p) => { setPage(p); void fetchTasks(p); }}
        onSearch={(q) => void fetchTasks(1, q)}
        searchPlaceholder="Search tasks..."
        isLoading={isLoading}
        emptyMessage="No business tasks found"
        rowKey={(row) => row.id}
        onRowClick={(row) => setSelectedId(row.id)}
      />

      <Sheet open={selectedId !== null} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-mono">{detail?.name ?? "Task Details"}</SheetTitle>
          </SheetHeader>

          {detailLoading ? <LoadingState rows={3} /> : detailError ? (
            <p className="text-sm text-destructive px-4 py-8 text-center">{detailError}</p>
          ) : detail && (
            <div className="space-y-4 px-4 pb-6">
              <Card>
                <CardContent className="p-3 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {detail.isCritical && <StatusBadge status="CRITICAL" size="sm" />}
                    <StatusBadge status={detail.riskLevel} size="sm" />
                    <StatusBadge status={detail.status} size="sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-muted-foreground">
                    <div>Dept: {detail.category}</div>
                    <div>Area: {detail.processArea}</div>
                    <div>Frequency: {detail.frequency}</div>
                    {detail.linkedModule && <div>Module: {detail.linkedModule}</div>}
                  </div>
                  {detail.description && <p className="text-sm text-muted-foreground">{detail.description}</p>}
                </CardContent>
              </Card>

              {/* Assignments (RACI) */}
              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground/60">
                    Responsibility Assignments ({detail.assignments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-1.5">
                  {detail.assignments.length === 0 && (
                    <p className="text-xs text-destructive italic">No assignments — task is unowned</p>
                  )}
                  {detail.assignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-xs py-1 border-b border-border/20 last:border-0">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={a.assignmentType} size="sm" />
                        <span>{a.roleTemplate?.title ?? "Direct"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        {a.user && <span className="text-[10px]">{a.user.firstName} {a.user.lastName}</span>}
                        {a.isTemporary && <span className="text-[9px] font-mono text-warning">(temp)</span>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {detail.coverageGaps.length > 0 && (
                <Card className="border-destructive/20">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-[10px] font-mono uppercase tracking-[0.12em] text-destructive/70">Gaps</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    {detail.coverageGaps.map((g, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs py-1">
                        <StatusBadge status={g.severity} size="sm" />
                        <span>{g.summary}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
