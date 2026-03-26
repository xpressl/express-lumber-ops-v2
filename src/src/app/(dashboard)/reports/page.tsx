"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const REPORTS = [
  { name: "On-Time Delivery", key: "on-time-delivery", category: "Delivery" },
  { name: "Route Profitability", key: "route-profitability", category: "Dispatch" },
  { name: "Order Cycle Time", key: "order-cycle-time", category: "Operations" },
  { name: "Pickup Wait Time", key: "pickup-wait-time", category: "Operations" },
  { name: "Receiving Discrepancy Rate", key: "receiving-discrepancy", category: "Receiving" },
  { name: "Vendor Fill Rate", key: "vendor-fill-rate", category: "Purchasing" },
  { name: "Price Change Impact", key: "price-change-impact", category: "Pricing" },
  { name: "Collector Performance", key: "collector-performance", category: "Collections" },
  { name: "Promise Kept Rate", key: "promise-kept-rate", category: "Collections" },
  { name: "Estimate Conversion", key: "estimate-conversion", category: "CRM" },
  { name: "Dormant Account Recovery", key: "dormant-recovery", category: "CRM" },
  { name: "Damage Frequency", key: "damage-frequency", category: "Yard" },
  { name: "Cycle Count Accuracy", key: "cycle-count-accuracy", category: "Yard" },
  { name: "Approval Turnaround", key: "approval-turnaround", category: "Admin" },
  { name: "Role Usage Audit", key: "role-usage-audit", category: "Admin" },
  { name: "Feature Adoption", key: "feature-adoption", category: "Admin" },
];

const categories = [...new Set(REPORTS.map((r) => r.category))];

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Reports" description="Operational KPI reports and analytics"
        breadcrumbs={[{ label: "Reports" }]} />

      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70 mb-3">{cat}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {REPORTS.filter((r) => r.category === cat).map((report) => (
              <Card key={report.key} className="card-warm hover:bg-muted/30 hover:shadow-md transition-all duration-200 cursor-pointer">
                <CardContent className="py-3">
                  <span className="text-sm font-medium">{report.name}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
