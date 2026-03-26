"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { KPICard } from "@/components/shared/kpi-card";
import { ExceptionCard } from "@/components/shared/exception-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/states";
import {
  AlertTriangle,
  Flame,
  AlertCircle,
  Info,
  CheckCircle,
  Layers,
} from "lucide-react";

interface ExceptionSummary {
  total: number;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
}

interface ExceptionItem {
  id: string; category: string; severity: string; status: string; title: string;
  description: string | null; entityType: string; entityName: string | null;
  slaTargetAt: string | null; createdAt: string; priorityScore: number;
}

/** Status color mapping for department health dot indicators */
const STATUS_COLORS: Record<string, string> = {
  operational: "bg-success",
  degraded: "bg-warning",
  down: "bg-destructive",
};

/** Border accent colors for department health cards */
const BORDER_COLORS: Record<string, string> = {
  operational: "border-l-success",
  degraded: "border-l-warning",
  down: "border-l-destructive",
};

const DEPARTMENTS = [
  { name: "Dispatch", status: "operational" },
  { name: "Yard", status: "operational" },
  { name: "Delivery", status: "operational" },
  { name: "Collections", status: "operational" },
  { name: "Purchasing", status: "operational" },
  { name: "Pricing", status: "operational" },
];

export default function CommandCenterPage() {
  const [summary, setSummary] = React.useState<ExceptionSummary | null>(null);
  const [exceptions, setExceptions] = React.useState<ExceptionItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const [sRes, eRes] = await Promise.all([
          fetch("/api/exceptions?view=summary"),
          fetch("/api/exceptions?severity=CRITICAL"),
        ]);
        if (sRes.ok) setSummary(await sRes.json());
        if (eRes.ok) setExceptions(await eRes.json());
      } finally { setIsLoading(false); }
    })();
  }, []);

  if (isLoading) return <LoadingState rows={6} />;

  const criticalCount = summary?.bySeverity?.["CRITICAL"] ?? 0;
  const highCount = summary?.bySeverity?.["HIGH"] ?? 0;
  const mediumCount = summary?.bySeverity?.["MEDIUM"] ?? 0;
  const lowCount = summary?.bySeverity?.["LOW"] ?? 0;
  const totalOpen = summary?.total ?? 0;
  const categoryCount = Object.keys(summary?.byCategory ?? {}).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Command Center"
        description="Operational overview — what needs attention right now"
      />

      {/* KPI Row */}
      <section>
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold mb-4 tracking-tight">
          Exception Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard
            title="Open Exceptions"
            value={totalOpen}
            trend={totalOpen > 0 ? "down" : "flat"}
            icon={AlertTriangle}
            accent={totalOpen > 0 ? "destructive" : "default"}
          />
          <KPICard
            title="Critical"
            value={criticalCount}
            icon={Flame}
            accent={criticalCount > 0 ? "destructive" : "default"}
          />
          <KPICard
            title="High"
            value={highCount}
            icon={AlertCircle}
            accent={highCount > 0 ? "warning" : "default"}
          />
          <KPICard
            title="Medium"
            value={mediumCount}
            icon={Info}
            accent="default"
          />
          <KPICard
            title="Low"
            value={lowCount}
            icon={CheckCircle}
            accent="success"
          />
          <KPICard
            title="Categories"
            value={categoryCount}
            icon={Layers}
            accent="default"
          />
        </div>
      </section>

      {/* Department Health */}
      <section>
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold mb-4 tracking-tight">
          Department Health
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {DEPARTMENTS.map((dept) => {
            const statusKey = dept.status.toLowerCase();
            const dotColor = STATUS_COLORS[statusKey] ?? "bg-muted-foreground";
            const borderColor = BORDER_COLORS[statusKey] ?? "border-l-muted";
            const statusLabel =
              statusKey === "operational"
                ? "Operational"
                : statusKey === "degraded"
                  ? "Degraded"
                  : "Down";

            return (
              <Card
                key={dept.name}
                className={`border-l-4 ${borderColor} transition-shadow duration-200 hover:shadow-md`}
              >
                <CardContent className="pt-4 pb-3 px-4">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    {dept.name}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${dotColor} shrink-0`}
                      aria-hidden="true"
                    />
                    <p className="text-sm font-medium">{statusLabel}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Top Exceptions */}
      <section>
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold mb-4 tracking-tight">
          Top Exceptions
        </h2>
        <Card>
          <CardContent className="pt-6">
            {exceptions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No critical exceptions
              </p>
            ) : (
              <div className="space-y-2">
                {exceptions.slice(0, 5).map((ex) => (
                  <ExceptionCard
                    key={ex.id}
                    {...ex}
                    description={ex.description ?? undefined}
                    entityName={ex.entityName ?? undefined}
                    slaTargetAt={ex.slaTargetAt ?? undefined}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
