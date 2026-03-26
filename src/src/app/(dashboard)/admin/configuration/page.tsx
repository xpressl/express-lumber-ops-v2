"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CONFIG_SECTIONS = [
  { title: "Order Statuses", description: "Custom order status labels and colors", key: "order_statuses" },
  { title: "Issue Codes", description: "Standard issue codes for exceptions", key: "issue_codes" },
  { title: "Delivery Failure Reasons", description: "Reasons for failed deliveries", key: "delivery_failure_reasons" },
  { title: "Backorder Reasons", description: "Standard backorder explanations", key: "backorder_reasons" },
  { title: "Damage Reasons", description: "Product damage classifications", key: "damage_reasons" },
  { title: "Yard Task Types", description: "Types of yard work assignments", key: "yard_task_types" },
  { title: "Route Color Rules", description: "Color coding for route zones on map", key: "route_color_rules" },
  { title: "Call Outcome Codes", description: "Collections call outcomes", key: "call_outcome_codes" },
  { title: "Credit Hold Rules", description: "Auto-hold thresholds and conditions", key: "credit_hold_rules" },
  { title: "Cutoff Times", description: "Dispatch and order cutoff by branch", key: "cutoff_times" },
  { title: "Truck Capacity Rules", description: "Weight/piece/length limits by truck type", key: "truck_capacity_rules" },
  { title: "POD Requirements", description: "Photo/signature requirements by order type", key: "pod_requirements" },
  { title: "Return Reason Codes", description: "Standard return reasons", key: "return_reason_codes" },
  { title: "Pickup Readiness Rules", description: "Conditions for pickup ready status", key: "pickup_readiness_rules" },
];

export default function OperationalConfigPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Operational Configuration"
        description="Manage configurable lookup tables, status codes, and business rules"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Configuration" }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CONFIG_SECTIONS.map((section) => (
          <Card key={section.key} className="hover:bg-muted/30 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{section.description}</p>
              <p className="text-[10px] font-mono text-muted-foreground/50 mt-2">{section.key}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
