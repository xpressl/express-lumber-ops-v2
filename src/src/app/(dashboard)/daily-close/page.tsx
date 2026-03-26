"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Loader2, CheckCircle, AlertCircle, PlayCircle, RefreshCw,
} from "lucide-react";

interface CloseSection {
  title: string;
  count: number | null;
  status: "ok" | "warning" | "critical" | "loading";
}

/** Build query string helpers */
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Fetch a count from a paginated API (uses the total field) */
async function fetchCount(url: string): Promise<number> {
  const res = await fetch(url);
  if (!res.ok) return 0;
  const json = await res.json();
  return json.total ?? json.count ?? (Array.isArray(json.data) ? json.data.length : 0);
}

/** Fetch exception summary count */
async function fetchExceptionCount(): Promise<number> {
  const res = await fetch("/api/exceptions?view=summary");
  if (!res.ok) return 0;
  const json = await res.json();
  return json.openCount ?? json.total ?? 0;
}

/** Fetch report data and return a count */
async function fetchReportCount(type: string): Promise<number> {
  const res = await fetch(`/api/reports?type=${encodeURIComponent(type)}`);
  if (!res.ok) return 0;
  const json = await res.json();
  return Array.isArray(json.data) ? json.data.length : 0;
}

/** All the sections we load for daily close */
const SECTION_DEFS = [
  { title: "Open Exceptions", fetcher: () => fetchExceptionCount() },
  { title: "Orders Not Dispatched", fetcher: () => fetchCount("/api/orders?status=CONFIRMED&limit=1") },
  { title: "Pending Deliveries", fetcher: () => fetchCount("/api/delivery?status=IN_TRANSIT&limit=1") },
  { title: "Open Pickups", fetcher: () => fetchCount("/api/pickups?status=OPEN&limit=1") },
  { title: "Receivings Pending Review", fetcher: () => fetchCount("/api/receiving?status=PENDING&limit=1") },
  { title: "Pending Approvals", fetcher: () => fetchCount("/api/approvals?status=PENDING&limit=1") },
  { title: "Outstanding Collections", fetcher: () => fetchCount("/api/collections?status=OVERDUE&limit=1") },
  { title: "On-Time Delivery", fetcher: () => fetchReportCount("on-time-delivery") },
  { title: "Unresolved Exceptions by Owner", fetcher: () => fetchCount("/api/exceptions?status=OPEN&limit=1") },
  { title: "Promises Due Today (Missed)", fetcher: () => fetchReportCount("promise-kept-rate") },
] as const;

function sectionStatus(count: number | null): "ok" | "warning" | "critical" | "loading" {
  if (count === null) return "loading";
  if (count === 0) return "ok";
  if (count <= 5) return "warning";
  return "critical";
}

export default function DailyClosePage() {
  const [sections, setSections] = React.useState<CloseSection[]>(
    SECTION_DEFS.map((d) => ({ title: d.title, count: null, status: "loading" }))
  );
  const [closeState, setCloseState] = React.useState<"idle" | "running" | "done">("idle");
  const [lastRefresh, setLastRefresh] = React.useState<Date | null>(null);

  /** Load all section data in parallel */
  const loadData = React.useCallback(async () => {
    setSections(SECTION_DEFS.map((d) => ({ title: d.title, count: null, status: "loading" })));

    const results = await Promise.allSettled(SECTION_DEFS.map((d) => d.fetcher()));

    setSections(results.map((r, i) => {
      const count = r.status === "fulfilled" ? r.value : 0;
      return { title: SECTION_DEFS[i].title, count, status: sectionStatus(count) };
    }));
    setLastRefresh(new Date());
  }, []);

  React.useEffect(() => { void loadData(); }, [loadData]);

  /** Simulated daily close action */
  async function handleRunClose() {
    setCloseState("running");
    await loadData();
    setCloseState("done");
  }

  const allLoaded = sections.every((s) => s.status !== "loading");
  const criticalCount = sections.filter((s) => s.status === "critical").length;
  const warningCount = sections.filter((s) => s.status === "warning").length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Daily Close"
        description="End-of-day operational reconciliation"
        breadcrumbs={[{ label: "Daily Close" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw size={14} className="mr-1" /> Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleRunClose}
              disabled={closeState === "running"}
            >
              {closeState === "running" ? (
                <Loader2 size={14} className="mr-1 animate-spin" />
              ) : closeState === "done" ? (
                <CheckCircle size={14} className="mr-1" />
              ) : (
                <PlayCircle size={14} className="mr-1" />
              )}
              {closeState === "done" ? "Close Complete" : "Run Daily Close"}
            </Button>
          </div>
        }
      />

      {/* Summary bar */}
      {allLoaded && (
        <div className="flex items-center gap-4 text-sm">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertCircle size={14} /> {criticalCount} section(s) need attention
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1 text-yellow-600">
              <AlertCircle size={14} /> {warningCount} warning(s)
            </span>
          )}
          {criticalCount === 0 && warningCount === 0 && (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle size={14} /> All clear
            </span>
          )}
          {lastRefresh && (
            <span className="text-xs text-muted-foreground ml-auto">
              Last refresh: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <Card key={section.title} className="card-warm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                {section.title}
                {section.status === "loading" ? (
                  <Loader2 size={14} className="animate-spin text-muted-foreground" />
                ) : section.status === "ok" ? (
                  <CheckCircle size={14} className="text-green-600" />
                ) : section.status === "warning" ? (
                  <AlertCircle size={14} className="text-yellow-600" />
                ) : (
                  <AlertCircle size={14} className="text-destructive" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {section.count !== null ? (
                <p className="text-2xl font-semibold font-mono">{section.count}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Loading...</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
