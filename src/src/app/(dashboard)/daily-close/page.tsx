"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CLOSE_SECTIONS = [
  "Uncompleted Stops",
  "COD Expected vs Collected",
  "Missing PODs",
  "Pickup Tickets Still Open",
  "Orders Loaded But Not Dispatched",
  "Receivings Pending Review",
  "AP Holds Created Today",
  "Promises Due Today (Missed)",
  "Unresolved Exceptions by Owner",
  "Approvals Still Pending",
  "Access Changes Made Today",
  "Sensitive Actions Taken Today",
];

export default function DailyClosePage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Daily Close" description="End-of-day operational reconciliation"
        breadcrumbs={[{ label: "Daily Close" }]} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CLOSE_SECTIONS.map((section) => (
          <Card key={section} className="card-warm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{section}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Data populated from live operations</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
