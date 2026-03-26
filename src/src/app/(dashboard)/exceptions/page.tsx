"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { ExceptionCard } from "@/components/shared/exception-card";
import { KPICard } from "@/components/shared/kpi-card";
import { LoadingState } from "@/components/shared/states";
import { AlertTriangle, UserX, ArrowUpCircle, Inbox } from "lucide-react";

interface ExceptionItem {
  id: string; category: string; severity: string; status: string; title: string;
  description: string | null; entityType: string; entityName: string | null;
  slaTargetAt: string | null; createdAt: string; priorityScore: number;
  ownerId: string | null;
}

export default function ExceptionCenterPage() {
  const [exceptions, setExceptions] = React.useState<ExceptionItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try { const r = await fetch("/api/exceptions"); if (r.ok) setExceptions(await r.json()); }
      finally { setIsLoading(false); }
    })();
  }, []);

  if (isLoading) return <LoadingState rows={5} />;

  const critical = exceptions.filter((e) => e.severity === "CRITICAL").length;
  const unowned = exceptions.filter((e) => !e.ownerId).length;

  return (
    <div className="space-y-8">
      <PageHeader title="Exception Center" description="All open exceptions requiring attention"
        breadcrumbs={[{ label: "Exceptions" }]} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Open" value={exceptions.length} icon={Inbox} />
        <KPICard title="Critical" value={critical} trend={critical > 0 ? "down" : "flat"} icon={AlertTriangle} />
        <KPICard title="Unowned" value={unowned} icon={UserX} />
        <KPICard title="Escalated" value={exceptions.filter((e) => e.status === "ESCALATED").length} icon={ArrowUpCircle} />
      </div>

      <div className="space-y-2">
        {exceptions.map((ex) => (
          <ExceptionCard key={ex.id} {...ex} description={ex.description ?? undefined} entityName={ex.entityName ?? undefined} slaTargetAt={ex.slaTargetAt ?? undefined} />
        ))}
        {exceptions.length === 0 && (
          <div className="text-center text-muted-foreground py-12">No open exceptions</div>
        )}
      </div>
    </div>
  );
}
