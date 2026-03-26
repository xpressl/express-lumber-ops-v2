"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { KPICard } from "@/components/shared/kpi-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/states";
import { ChartTab } from "@/components/org-map/tabs/chart-tab";
import { RolesTab } from "@/components/org-map/tabs/roles-tab";
import { TasksTab } from "@/components/org-map/tabs/tasks-tab";
import { MatrixTab } from "@/components/org-map/tabs/matrix-tab";
import { CoverageTab } from "@/components/org-map/tabs/coverage-tab";
import type { OrgUnitNode } from "@/components/org-map/org-node";

interface OrgStats {
  totalUnits: number;
  activeRoles: number;
  coverageGaps: number;
  hiringRequests: number;
}

function OverviewTab({ stats, isLoading }: { stats: OrgStats | null; isLoading: boolean }) {
  if (isLoading) return <LoadingState rows={4} />;

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Org Units" value={stats?.totalUnits ?? 0} />
        <KPICard title="Active Roles" value={stats?.activeRoles ?? 0} />
        <KPICard
          title="Coverage Gaps"
          value={stats?.coverageGaps ?? 0}
          trend={stats && stats.coverageGaps > 0 ? "down" : "flat"}
          trendLabel={stats && stats.coverageGaps > 0 ? "needs attention" : "all clear"}
        />
        <KPICard
          title="Hiring Requests"
          value={stats?.hiringRequests ?? 0}
          trend={stats && stats.hiringRequests > 0 ? "down" : "flat"}
        />
      </div>

      {/* Quick summary */}
      <div
        className="rounded-xl border border-border/30 p-6"
        style={{
          backgroundColor: "oklch(0.14 0.008 260)",
          backgroundImage: [
            "linear-gradient(oklch(0.45 0.08 85 / 0.04) 1px, transparent 1px)",
            "linear-gradient(90deg, oklch(0.45 0.08 85 / 0.04) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "24px 24px",
        }}
      >
        <div className="max-w-lg mx-auto text-center space-y-3">
          <h3 className="text-lg font-semibold font-mono tracking-tight">Organization Blueprint</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Map every department, role, and task in the business. Assign ownership, detect coverage gaps,
            and plan hiring — all from one operational control center.
          </p>
          <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[0.15em]">
            Use the tabs above to explore the organization structure
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrgMapPage() {
  const [stats, setStats] = React.useState<OrgStats | null>(null);
  const [units, setUnits] = React.useState<OrgUnitNode[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      setError(null);
      try {
        const [statsRes, unitsRes] = await Promise.all([
          fetch("/api/org-map/units?view=stats"),
          fetch("/api/org-map/units"),
        ]);
        if (!statsRes.ok || !unitsRes.ok) {
          setError("Failed to load organization data");
          return;
        }
        setStats(await statsRes.json());
        setUnits(await unitsRes.json());
      } catch {
        setError("Failed to load organization data");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Map"
        description="Structural blueprint of Express Lumber operations — roles, tasks, and accountability"
        breadcrumbs={[{ label: "Org Map" }]}
      />

      {error && <p className="text-sm text-destructive px-4 py-8 text-center">{error}</p>}

      <Tabs defaultValue="overview">
        <TabsList variant="line" className="border-b border-border/30 w-full justify-start">
          <TabsTrigger value="overview" className="font-mono text-xs uppercase tracking-wider">
            Overview
          </TabsTrigger>
          <TabsTrigger value="chart" className="font-mono text-xs uppercase tracking-wider">
            Org Chart
          </TabsTrigger>
          <TabsTrigger value="roles" className="font-mono text-xs uppercase tracking-wider">
            Role Catalog
          </TabsTrigger>
          <TabsTrigger value="tasks" className="font-mono text-xs uppercase tracking-wider">
            Task Library
          </TabsTrigger>
          <TabsTrigger value="matrix" className="font-mono text-xs uppercase tracking-wider">
            Responsibility Map
          </TabsTrigger>
          <TabsTrigger value="coverage" className="font-mono text-xs uppercase tracking-wider">
            Coverage &amp; Gaps
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <OverviewTab stats={stats} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="chart" className="pt-4">
          <ChartTab units={units} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="roles" className="pt-4">
          <RolesTab />
        </TabsContent>

        <TabsContent value="tasks" className="pt-4">
          <TasksTab />
        </TabsContent>

        <TabsContent value="matrix" className="pt-4">
          <MatrixTab />
        </TabsContent>

        <TabsContent value="coverage" className="pt-4">
          <CoverageTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
