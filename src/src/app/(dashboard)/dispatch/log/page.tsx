"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { format } from "date-fns";
import { Truck } from "lucide-react";

interface DispatchRouteRow {
  id: string;
  routeNumber: string;
  truck: { number: string; type: string };
  status: string;
  totalStops: number;
  totalWeight: number | null;
  dispatchedAt: string | null;
}

const columns: DataTableColumn<DispatchRouteRow>[] = [
  {
    id: "route",
    header: "Route #",
    cell: (r) => (
      <span className="font-mono text-[12px] font-semibold text-foreground">
        {r.routeNumber}
      </span>
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
      <span className="font-mono text-[12px] tabular-nums">{r.totalStops}</span>
    ),
    className: "text-center",
  },
  {
    id: "weight",
    header: "Weight",
    cell: (r) => (
      <span className="font-mono text-[12px] tabular-nums">
        {r.totalWeight ? `${Number(r.totalWeight).toLocaleString()} lbs` : "\u2014"}
      </span>
    ),
    className: "text-right",
  },
  {
    id: "dispatched",
    header: "Dispatched",
    cell: (r) => (
      <span className="text-[12px] text-muted-foreground tabular-nums">
        {r.dispatchedAt
          ? format(new Date(r.dispatchedAt), "MMM dd, yyyy")
          : "\u2014"}
      </span>
    ),
    sortable: true,
  },
];

export default function DispatchLogPage() {
  const router = useRouter();
  const [data, setData] = React.useState<DispatchRouteRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dispatch/routes");
        if (res.ok) setData(await res.json());
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dispatch Log"
        description="History of dispatched routes"
        breadcrumbs={[
          { label: "Dispatch", href: "/dispatch" },
          { label: "Log" },
        ]}
      />

      <DataTable
        columns={columns}
        data={data}
        total={data.length}
        isLoading={isLoading}
        searchPlaceholder="Search routes..."
        emptyMessage="No dispatched routes"
        rowKey={(r) => r.id}
        onRowClick={(r) => router.push(`/dispatch`)}
      />
    </div>
  );
}
