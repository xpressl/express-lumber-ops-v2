"use client";

import * as React from "react";
import { KPICard } from "@/components/shared/kpi-card";
import { GapCard } from "@/components/org-map/gap-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingState } from "@/components/shared/states";

interface CoverageStats {
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  total: number;
}

interface GapItem {
  id: string;
  gapType: string;
  severity: string;
  status: string;
  summary: string;
  recommendedAction: string | null;
  task: { name: string } | null;
  roleTemplate: { title: string } | null;
  user: { firstName: string; lastName: string } | null;
  location: { name: string } | null;
}

interface HiringItem {
  id: string;
  urgency: string;
  status: string;
  reason: string;
  roleTemplate: { title: string };
  location: { name: string } | null;
  orgUnit: { name: string } | null;
}

export function CoverageTab() {
  const [stats, setStats] = React.useState<CoverageStats | null>(null);
  const [gaps, setGaps] = React.useState<GapItem[]>([]);
  const [hiring, setHiring] = React.useState<HiringItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = React.useState("");

  React.useEffect(() => {
    (async () => {
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filterSeverity) params.set("severity", filterSeverity);
        const [sRes, gRes, hRes] = await Promise.all([
          fetch("/api/org-map/coverage?view=stats"),
          fetch(`/api/org-map/coverage?${params}`),
          fetch("/api/org-map/coverage?view=hiring"),
        ]);
        if (!sRes.ok || !gRes.ok || !hRes.ok) {
          setError("Failed to load coverage data");
          return;
        }
        setStats(await sRes.json());
        const gData = await gRes.json();
        setGaps(Array.isArray(gData) ? gData : []);
        const hData = await hRes.json();
        setHiring(Array.isArray(hData) ? hData : []);
      } catch {
        setError("Failed to load coverage data");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [filterSeverity]);

  if (isLoading) return <LoadingState rows={6} />;
  if (error) return <p className="text-sm text-destructive px-4 py-8 text-center">{error}</p>;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KPICard title="Total Gaps" value={stats?.total ?? 0} trend={stats && stats.total > 0 ? "down" : "flat"} />
        <KPICard title="Critical" value={stats?.bySeverity?.["CRITICAL"] ?? 0} />
        <KPICard title="High" value={stats?.bySeverity?.["HIGH"] ?? 0} />
        <KPICard title="No Owner" value={stats?.byType?.["NO_OWNER"] ?? 0} />
        <KPICard title="No Backup" value={stats?.byType?.["NO_BACKUP"] ?? 0} />
        <KPICard title="Hiring Open" value={hiring.filter((h) => h.status !== "FILLED" && h.status !== "CANCELLED").length} />
      </div>

      {/* Gap type breakdown */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(stats.byType).map(([type, count]) => (
            <Card key={type}>
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {type.replace(/_/g, " ")}
                </p>
                <p className={`text-lg font-mono font-semibold mt-1 ${count > 0 ? "text-destructive" : "text-success"}`}>
                  {count}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Coverage Gaps */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Coverage Gaps</h3>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="h-7 rounded-md border border-border/50 bg-card px-2 text-[10px] font-mono"
          >
            <option value="">All Severities</option>
            {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {gaps.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No coverage gaps found — all clear.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {gaps.map((g) => (
              <GapCard
                key={g.id}
                gapType={g.gapType}
                severity={g.severity}
                status={g.status}
                summary={g.summary}
                recommendedAction={g.recommendedAction}
                taskName={g.task?.name}
                roleName={g.roleTemplate?.title}
                userName={g.user ? `${g.user.firstName} ${g.user.lastName}` : null}
                locationName={g.location?.name}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hiring Requests */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Hiring Requests</h3>
        {hiring.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No open hiring requests.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border/30">
                {hiring.map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm font-medium">{h.roleTemplate.title}</p>
                      <p className="text-xs text-muted-foreground">{h.reason}</p>
                      <div className="flex gap-2 mt-1 text-[10px] font-mono text-muted-foreground/70">
                        {h.location && <span>{h.location.name}</span>}
                        {h.orgUnit && <span>{h.orgUnit.name}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <StatusBadge status={h.urgency} size="sm" />
                      <StatusBadge status={h.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
