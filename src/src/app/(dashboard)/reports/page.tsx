"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { FileText, Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";

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

type GenerateState = "idle" | "loading" | "success" | "error";

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = React.useState<typeof REPORTS[number] | null>(null);
  const [generateState, setGenerateState] = React.useState<GenerateState>("idle");
  const [reportResult, setReportResult] = React.useState<{
    generatedAt: string;
    message: string;
  } | null>(null);

  /** Call the reports API for the selected report type */
  async function handleGenerate() {
    if (!selectedReport) return;
    setGenerateState("loading");
    try {
      const res = await fetch(`/api/reports?type=${encodeURIComponent(selectedReport.key)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setReportResult({ generatedAt: json.generatedAt, message: json.message });
      setGenerateState("success");
    } catch {
      setGenerateState("error");
    }
  }

  function handleClose() {
    setSelectedReport(null);
    setGenerateState("idle");
    setReportResult(null);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        description="Operational KPI reports and analytics"
        breadcrumbs={[{ label: "Reports" }]}
      />

      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70 mb-3">
            {cat}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {REPORTS.filter((r) => r.category === cat).map((report) => (
              <Card
                key={report.key}
                className="card-warm hover:bg-muted/30 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => { setSelectedReport(report); setGenerateState("idle"); setReportResult(null); }}
              >
                <CardContent className="py-3 flex items-center justify-between">
                  <span className="text-sm font-medium">{report.name}</span>
                  <FileText size={14} className="text-muted-foreground/50" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Report generate/export dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedReport?.name}</DialogTitle>
            <DialogDescription>
              Generate this report from live operational data.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            {generateState === "idle" && (
              <p className="text-sm text-muted-foreground">
                Click &quot;Generate&quot; to pull the latest data for this report.
              </p>
            )}
            {generateState === "loading" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={16} className="animate-spin" />
                Generating report...
              </div>
            )}
            {generateState === "success" && reportResult && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle size={16} />
                  Report generated
                </div>
                <p className="text-xs text-muted-foreground">
                  Generated at {new Date(reportResult.generatedAt).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{reportResult.message}</p>
              </div>
            )}
            {generateState === "error" && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle size={16} />
                Failed to generate report. Please try again.
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            {generateState === "success" ? (
              <Button onClick={handleClose}>
                <Download size={14} className="mr-1" /> Done
              </Button>
            ) : (
              <Button onClick={handleGenerate} disabled={generateState === "loading"}>
                {generateState === "loading" ? (
                  <Loader2 size={14} className="mr-1 animate-spin" />
                ) : (
                  <FileText size={14} className="mr-1" />
                )}
                Generate
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
