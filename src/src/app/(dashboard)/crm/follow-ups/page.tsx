"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingState } from "@/components/shared/states";

interface FollowUp { id: string; estimateNumber: string; jobName: string | null; status: string; totalAmount: number; followUpDate: string | null }

export default function FollowUpsPage() {
  const [items, setItems] = React.useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try { const r = await fetch("/api/crm/follow-ups"); if (r.ok) setItems(await r.json()); } finally { setIsLoading(false); }
    })();
  }, []);

  if (isLoading) return <LoadingState rows={4} />;

  return (
    <div className="space-y-8">
      <PageHeader title="Follow-Ups" description="Estimates requiring follow-up action"
        breadcrumbs={[{ label: "CRM", href: "/crm" }, { label: "Follow-Ups" }]} />
      {items.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No follow-ups due</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <span className="font-mono text-xs">{item.estimateNumber}</span>
                  {item.jobName && <span className="text-sm ml-2">{item.jobName}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs">${Number(item.totalAmount).toLocaleString()}</span>
                  <StatusBadge status={item.status} size="sm" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
