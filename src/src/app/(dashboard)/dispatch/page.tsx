"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { KPICard } from "@/components/shared/kpi-card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Truck, Package, Route, ClipboardList, Plus } from "lucide-react";

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
  {
    id: "order",
    header: "Order",
    cell: (r) => (
      <span className="font-mono text-[12px] font-semibold text-foreground">{r.orderNumber}</span>
    ),
    sortable: true,
  },
  {
    id: "customer",
    header: "Customer",
    cell: (r) => <span className="text-[13px] font-medium">{r.customer.companyName}</span>,
  },
  {
    id: "status",
    header: "Status",
    cell: (r) => <StatusBadge status={r.status} size="sm" />,
  },
  {
    id: "date",
    header: "Date",
    cell: (r) => (
      <span className="text-[12px] text-muted-foreground tabular-nums">
        {format(new Date(r.requestedDate), "MMM dd")}
      </span>
    ),
  },
  {
    id: "weight",
    header: "Weight",
    cell: (r) => (
      <span className="font-mono text-[12px] tabular-nums">
        {r.totalWeight ? `${Number(r.totalWeight).toLocaleString()} lbs` : "—"}
      </span>
    ),
    className: "text-right",
  },
  {
    id: "ready",
    header: "Ready",
    cell: (r) => {
      const pct = r.readinessPercent;
      return (
        <div className="flex items-center gap-2">
          <div className="w-12 h-1.5 rounded-full bg-muted/50 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pct === 100 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-destructive/60"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`font-mono text-[11px] tabular-nums ${
            pct === 100 ? "text-success" : "text-muted-foreground"
          }`}>
            {pct}%
          </span>
        </div>
      );
    },
  },
  {
    id: "truck",
    header: "Truck",
    cell: (r) =>
      r.truckId ? (
        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-primary">
          <Truck size={12} />
          Assigned
        </span>
      ) : (
        <span className="text-[12px] text-muted-foreground/50">Unassigned</span>
      ),
  },
];

const routeColumns: DataTableColumn<RouteRow>[] = [
  {
    id: "route",
    header: "Route",
    cell: (r) => (
      <span className="font-mono text-[12px] font-semibold text-foreground">{r.routeNumber}</span>
    ),
    sortable: true,
  },
  {
    id: "truck",
    header: "Truck",
    cell: (r) => (
      <div className="flex items-center gap-1.5">
        <Truck size={13} className="text-muted-foreground/50" />
        <span className="text-[13px]">
          {r.truck.number}
          <span className="text-muted-foreground/50 ml-1">({r.truck.type})</span>
        </span>
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (r) => <StatusBadge status={r.status} size="sm" />,
  },
  {
    id: "stops",
    header: "Stops",
    cell: (r) => (
      <div className="flex items-center gap-2">
        <span className="font-mono text-[12px] tabular-nums font-medium">
          {r.completedStops}
          <span className="text-muted-foreground/40 mx-0.5">/</span>
          {r.totalStops}
        </span>
      </div>
    ),
    className: "text-center",
  },
  {
    id: "weight",
    header: "Weight",
    cell: (r) => (
      <span className="font-mono text-[12px] tabular-nums">
        {r.totalWeight ? `${Number(r.totalWeight).toLocaleString()} lbs` : "—"}
      </span>
    ),
    className: "text-right",
  },
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
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const unassigned = orders.filter((o) => !o.truckId).length;
  const ready = orders.filter((o) => o.readinessPercent === 100).length;
  const activeRoutes = routes.filter((r) => ["DISPATCHED", "IN_PROGRESS"].includes(r.status)).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dispatch Board"
        description="Plan routes, assign trucks, and track deliveries"
        breadcrumbs={[{ label: "Dispatch" }]}
        actions={
          <Button className="rounded-lg gap-2 font-medium text-[13px] h-9 px-4">
            <Plus size={15} />
            New Route
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Unassigned"
          value={unassigned}
          trend={unassigned > 0 ? "down" : "flat"}
          trendLabel={unassigned > 0 ? "needs attention" : "all clear"}
          icon={Package}
          accent={unassigned > 0 ? "warning" : "success"}
        />
        <KPICard
          title="Ready to Go"
          value={ready}
          trend="up"
          icon={ClipboardList}
          accent="success"
        />
        <KPICard
          title="Active Routes"
          value={activeRoutes}
          icon={Route}
          accent="copper"
        />
        <KPICard
          title="Total Orders"
          value={orders.length}
          icon={Truck}
        />
      </div>

      <Tabs defaultValue="orders">
        <TabsList className="bg-muted/30 border border-border/40 p-1 rounded-xl h-auto">
          <TabsTrigger
            value="orders"
            className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
          >
            Order Board
            <span className="ml-2 text-[11px] font-mono text-muted-foreground tabular-nums">
              {orders.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="routes"
            className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
          >
            Routes
            <span className="ml-2 text-[11px] font-mono text-muted-foreground tabular-nums">
              {routes.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-5">
          <DataTable
            columns={orderColumns}
            data={orders}
            total={orders.length}
            isLoading={isLoading}
            searchPlaceholder="Search orders..."
            emptyMessage="No orders for dispatch"
            rowKey={(r) => r.id}
          />
        </TabsContent>

        <TabsContent value="routes" className="mt-5">
          <DataTable
            columns={routeColumns}
            data={routes}
            total={routes.length}
            isLoading={isLoading}
            emptyMessage="No routes created"
            rowKey={(r) => r.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
