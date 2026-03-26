"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDistanceToNow } from "date-fns";

interface SecurityEvent {
  id: string;
  type: string;
  actorId: string | null;
  targetUserId: string | null;
  success: boolean;
  ipAddress: string | null;
  timestamp: string;
}

export default function SecurityEventsPage() {
  const [events, setEvents] = React.useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // TODO: Create /api/security endpoint
    setIsLoading(false);
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader title="Security Events" description="Login activity, permission changes, sensitive access"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Security" }]} />
      {isLoading ? null : events.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">
          Security events will appear here once the system is active.
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {events.map((e) => (
            <Card key={e.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <StatusBadge status={e.success ? "ACTIVE" : "SUSPENDED"} size="sm" />
                  <span className="font-mono text-xs">{e.type}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(e.timestamp), { addSuffix: true })}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
