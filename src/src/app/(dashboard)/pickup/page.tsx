"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/states";
import { formatDistanceToNow } from "date-fns";

interface PickupTicket {
  id: string;
  orderId: string;
  customerId: string;
  status: string;
  lane: string | null;
  bay: string | null;
  arrivedAt: string | null;
  readyAt: string | null;
  createdAt: string;
}

export default function PickupQueuePage() {
  const [tickets, setTickets] = React.useState<PickupTicket[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchTickets = React.useCallback(async () => {
    try {
      const res = await fetch("/api/pickups");
      if (res.ok) setTickets(await res.json());
    } finally { setIsLoading(false); }
  }, []);

  React.useEffect(() => { void fetchTickets(); }, [fetchTickets]);

  async function handleAction(ticketId: string, action: string) {
    await fetch(`/api/pickups/${ticketId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    void fetchTickets();
  }

  if (isLoading) return <LoadingState rows={4} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Pickup Queue" description="Customer pickup and will-call management"
        breadcrumbs={[{ label: "Pickup" }]} />

      {tickets.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">No pickups in queue</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tickets.map((t) => (
            <Card key={t.id} className="border-l-4 border-l-primary">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs">{t.orderId.slice(0, 8)}</span>
                  <StatusBadge status={t.status} size="sm" />
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {t.lane && <div>Lane: <span className="font-mono text-foreground">{t.lane}</span></div>}
                  {t.bay && <div>Bay: <span className="font-mono text-foreground">{t.bay}</span></div>}
                  <div>Waiting: {formatDistanceToNow(new Date(t.createdAt))}</div>
                  {t.arrivedAt && <div>Arrived: {formatDistanceToNow(new Date(t.arrivedAt))} ago</div>}
                </div>
                <div className="flex gap-2">
                  {t.status === "WAITING" && (
                    <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => void handleAction(t.id, "arrived")}>Customer Arrived</Button>
                  )}
                  {t.status === "READY_AT_LANE" && (
                    <Button size="sm" className="text-xs flex-1" onClick={() => void handleAction(t.id, "handoff")}>Handoff</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
