"use client";

import * as React from "react";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/states";

interface RoleRow {
  id: string;
  title: string;
  criticality: string;
  targetHeadcount: number;
  status: string;
  orgUnit: { id: string; name: string } | null;
  requiredSkills: { skill: { name: string } }[];
  _count: { taskAssignments: number; coverageGaps: number };
}

interface RoleDetail {
  id: string;
  title: string;
  summary: string | null;
  mission: string | null;
  criticality: string;
  targetHeadcount: number;
  status: string;
  orgUnit: { name: string } | null;
  requiredSkills: { skill: { name: string }; requiredLevel: number }[];
  taskAssignments: { assignmentType: string; task: { name: string }; user: { firstName: string; lastName: string } | null }[];
  coverageGaps: { gapType: string; severity: string; summary: string }[];
  permissionReqs: { permissionCode: string }[];
}

const columns: DataTableColumn<RoleRow>[] = [
  {
    id: "title",
    header: "Role",
    cell: (row) => (
      <div>
        <span className="font-medium">{row.title}</span>
        {row.orgUnit && (
          <p className="text-[10px] font-mono text-muted-foreground">{row.orgUnit.name}</p>
        )}
      </div>
    ),
    sortable: true,
  },
  {
    id: "criticality",
    header: "Criticality",
    cell: (row) => <StatusBadge status={row.criticality} size="sm" />,
    sortable: true,
  },
  {
    id: "headcount",
    header: "Target HC",
    cell: (row) => <span className="font-mono text-sm">{row.targetHeadcount}</span>,
  },
  {
    id: "skills",
    header: "Skills",
    cell: (row) => (
      <div className="flex flex-wrap gap-1">
        {row.requiredSkills.slice(0, 3).map((rs, i) => (
          <span key={i} className="text-[9px] font-mono bg-muted px-1.5 py-0.5 rounded">{rs.skill.name}</span>
        ))}
        {row.requiredSkills.length > 3 && (
          <span className="text-[9px] font-mono text-muted-foreground">+{row.requiredSkills.length - 3}</span>
        )}
      </div>
    ),
  },
  {
    id: "tasks",
    header: "Tasks",
    cell: (row) => <span className="font-mono text-xs">{row._count.taskAssignments}</span>,
  },
  {
    id: "gaps",
    header: "Gaps",
    cell: (row) => (
      <span className={`font-mono text-xs ${row._count.coverageGaps > 0 ? "text-destructive" : ""}`}>
        {row._count.coverageGaps}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} size="sm" />,
  },
];

export function RolesTab() {
  const [roles, setRoles] = React.useState<RoleRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<RoleDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [detailError, setDetailError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState<string | undefined>();

  const fetchRoles = React.useCallback(async (search?: string, pageNum = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(pageNum));
      const res = await fetch(`/api/org-map/roles?${params}`);
      if (!res.ok) { setError("Failed to load roles"); return; }
      const data = await res.json();
      setRoles(data.data ?? []);
      setTotal(data.total ?? 0);
      setPage(data.page ?? 1);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setError("Failed to load roles");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => { void fetchRoles(); }, [fetchRoles]);

  React.useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    setDetailLoading(true);
    setDetailError(null);
    fetch(`/api/org-map/roles/${selectedId}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject("Failed")))
      .then((d) => setDetail(d))
      .catch((e) => {
        if (e !== "AbortError" && e?.name !== "AbortError")
          setDetailError("Failed to load role details");
      })
      .finally(() => setDetailLoading(false));
    return () => controller.abort();
  }, [selectedId]);

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive px-4 py-8 text-center">{error}</p>}
      <DataTable
        columns={columns}
        data={roles}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => void fetchRoles(searchQuery, p)}
        onSearch={(q) => { setSearchQuery(q); void fetchRoles(q, 1); }}
        searchPlaceholder="Search roles..."
        isLoading={isLoading}
        emptyMessage="No role templates found"
        rowKey={(row) => row.id}
        onRowClick={(row) => setSelectedId(row.id)}
      />

      <Sheet open={selectedId !== null} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-mono">{detail?.title ?? "Role Details"}</SheetTitle>
          </SheetHeader>

          {detailLoading ? <LoadingState rows={3} /> : detailError ? (
            <p className="text-sm text-destructive px-4 py-8 text-center">{detailError}</p>
          ) : detail && (
            <div className="space-y-4 px-4 pb-6">
              <Card>
                <CardContent className="p-3 space-y-2">
                  <div className="flex gap-2">
                    <StatusBadge status={detail.criticality} size="sm" />
                    <StatusBadge status={detail.status} size="sm" />
                  </div>
                  {detail.summary && <p className="text-sm">{detail.summary}</p>}
                  {detail.mission && <p className="text-xs text-muted-foreground italic">{detail.mission}</p>}
                  <p className="text-[10px] font-mono text-muted-foreground">Target headcount: {detail.targetHeadcount}</p>
                  {detail.orgUnit && <p className="text-[10px] font-mono text-muted-foreground">Org unit: {detail.orgUnit.name}</p>}
                </CardContent>
              </Card>

              {detail.requiredSkills.length > 0 && (
                <Card>
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground/60">Required Skills</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    {detail.requiredSkills.map((rs, i) => (
                      <div key={i} className="flex justify-between text-xs py-1 border-b border-border/20 last:border-0">
                        <span>{rs.skill.name}</span>
                        <span className="font-mono text-muted-foreground">Lvl {rs.requiredLevel}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {detail.taskAssignments.length > 0 && (
                <Card>
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground/60">
                      Assigned Tasks ({detail.taskAssignments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    {detail.taskAssignments.map((ta, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/20 last:border-0">
                        <span>{ta.task.name}</span>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={ta.assignmentType} size="sm" />
                          {ta.user && <span className="text-[10px] text-muted-foreground">{ta.user.firstName}</span>}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {detail.permissionReqs.length > 0 && (
                <Card>
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground/60">Required Permissions</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="flex flex-wrap gap-1">
                      {detail.permissionReqs.map((p, i) => (
                        <span key={i} className="text-[9px] font-mono bg-muted px-1.5 py-0.5 rounded">{p.permissionCode}</span>
                      ))}
                    </div>
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
