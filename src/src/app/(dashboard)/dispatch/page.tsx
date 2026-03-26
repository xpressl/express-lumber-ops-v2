"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { KPICard } from "@/components/shared/kpi-card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface DispatchOrderRow {
  id: string;
  orderNumber: string;
  customer: { companyName: string };
  type: string;
  status: string;
  requestedDate: string;
  totalWeight: number | null;
  totalPieces: number | null;
  readinessPercent: number;
  truckId: string | null;
}

interface RouteRow {
  id: string;
  routeNumber: string;
  truck: { number: string; type: string };
  status: string;
  totalStops: number;
  completedStops: number;
  totalWeight: number | null;
}

const orderColumns: DataTableColumn<DispatchOrderRow>[] = [
  { id: "order", header: "Order", cell: (r) => <span className="font-mono text-xs font-medium">{r.orderNumber}</span>, sortable: true },
  { id: "customer", header: "Customer", cell: (r) => <span className="text-sm">{r.customer.companyName}</span> },
  { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} size="sm" /> },
  { id: "date", header: "Date", cell: (r) => <span className="text-xs font-mono">{format(new Date(r.requestedDate), "MM/dd")}</span> },
  { id: "weight", header: "Weight", cell: (r) => <span className="font-mono text-xs">{r.totalWeight ? `${Number(r.totalWeight).toLocaleString()} lbs` : "—"}</span>, className: "text-right" },
  { id: "ready", header: "Ready", cell: (r) => <span className={`font-mono text-xs ${r.readinessPercent === 100 ? "text-success" : "text-warning"}`}>{r.readinessPercent}%</span>, className: "text-center" },
  { id: "truck", header: "Truck", cell: (r) => r.truckId ? <span className="text-xs font-mono text-primary">Assigned</span> : <span className="text-xs text-muted-foreground">Unassigned</span> },
];

const routeColumns: DataTableColumn<RouteRow>[] = [
  { id: "route", header: "Route", cell: (r) => <span className="font-mono text-xs font-medium">{r.routeNumber}</span>, sortable: true },
  { id: "truck", header: "Truck", cell: (r) => <span className="font-mono text-xs">{r.truck.number} ({r.truck.type})</span> },
  { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} size="sm" /> },
  { id: "stops", header: "Stops", cell: (r) => <span className="font-mono text-xs">{r.completedStops}/{r.totalStops}</span>, className: "text-center" },
  { id: "weight", header: "Weight", cell: (r) => <span className="font-mono text-xs">{r.totalWeight ? `${Number(r.totalWeight).toLocaleString()} lbs` : "—"}</span>, className: "text-right" },
];

export default function DispatchPage() {
  const [orders, setOrders] = React.useState<DispatchOrderRow[]>([]);
  const [routes, setRoutes] = React.useState<RouteRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const [ordersRes, routesRes] = await Promise.all([
          fetch("/api/dispatch"),
          fetch("/api/dispatch/routes"),
        ]);
        if (ordersRes.ok) setOrders(await ordersRes.json());
        if (routesRes.ok) setRoutes(await routesRes.json());
      } finally { setIsLoading(false); }
    })();
  }, []);

  const unassigned = orders.filter((o) => !o.truckId).length;
  const ready = orders.filter((o) => o.readinessPercent === 100).length;
  const activeRoutes = routes.filter((r) => ["DISPATCHED", "IN_PROGRESS"].includes(r.status)).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Dispatch Board" description="Plan routes, assign trucks, and track deliveries"
        breadcrumbs={[{ label: "Dispatch" }]}
        actions={<Button className="font-mono uppercase tracking-wider text-xs">+ New Route</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Unassigned" value={unassigned} trend={unassigned > 0 ? "down" : "flat"} />
        <KPICard title="Ready" value={ready} trend="up" />
        <KPICard title="Active Routes" value={activeRoutes} />
        <KPICard title="Total Orders" value={orders.length} />
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Order Board ({orders.length})</TabsTrigger>
          <TabsTrigger value="routes">Routes ({routes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          <DataTable columns={orderColumns} data={orders} total={orders.length}
            isLoading={isLoading} searchPlaceholder="Search orders..."
            emptyMessage="No orders for dispatch" rowKey={(r) => r.id} />
        </TabsContent>

        <TabsContent value="routes" className="mt-4">
          <DataTable columns={routeColumns} data={routes} total={routes.length}
            isLoading={isLoading} emptyMessage="No routes created"
            rowKey={(r) => r.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
