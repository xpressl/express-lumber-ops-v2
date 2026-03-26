"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format } from "date-fns";

interface OrderRow {
  id: string;
  orderNumber: string;
  type: string;
  status: string;
  customer: { companyName: string };
  requestedDate: string;
  totalAmount: number | null;
  totalPieces: number | null;
  readinessPercent: number;
  _count: { items: number };
}

const columns: DataTableColumn<OrderRow>[] = [
  { id: "orderNumber", header: "Order #", cell: (r) => <span className="font-mono text-xs font-medium">{r.orderNumber}</span>, sortable: true },
  { id: "customer", header: "Customer", cell: (r) => <span className="text-sm">{r.customer.companyName}</span>, sortable: true },
  { id: "type", header: "Type", cell: (r) => <span className="text-[10px] font-mono uppercase">{r.type}</span> },
  { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} size="sm" />, sortable: true },
  { id: "date", header: "Requested", cell: (r) => <span className="text-xs font-mono">{format(new Date(r.requestedDate), "MM/dd")}</span>, sortable: true },
  { id: "items", header: "Items", accessorFn: (r) => r._count.items, className: "text-center font-mono" },
  { id: "amount", header: "Amount", cell: (r) => r.totalAmount ? <span className="font-mono text-xs">${Number(r.totalAmount).toLocaleString()}</span> : <span className="text-muted-foreground">—</span>, className: "text-right" },
  { id: "ready", header: "Ready", cell: (r) => {
    const pct = r.readinessPercent;
    return <span className={`font-mono text-xs ${pct === 100 ? "text-success" : pct > 0 ? "text-warning" : "text-muted-foreground"}`}>{pct}%</span>;
  }, className: "text-center" },
];

export default function OrdersPage() {
  const router = useRouter();
  const [data, setData] = React.useState<OrderRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchOrders = React.useCallback(async (p = 1, search?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) { const json = await res.json(); setData(json.data); setTotal(json.total); }
    } finally { setIsLoading(false); }
  }, []);

  React.useEffect(() => { void fetchOrders(); }, [fetchOrders]);

  return (
    <div className="space-y-8">
      <PageHeader title="Orders" description="Order lifecycle management"
        breadcrumbs={[{ label: "Orders" }]}
        actions={<Button className="rounded-lg gap-2 font-medium text-[13px] h-9 px-4"><Plus size={15} />New Order</Button>} />

      <DataTable columns={columns} data={data} total={total} page={page}
        totalPages={Math.ceil(total / 20)}
        onPageChange={(p) => { setPage(p); void fetchOrders(p); }}
        onSearch={(q) => void fetchOrders(1, q)}
        searchPlaceholder="Search by order#, customer, PO..."
        isLoading={isLoading} emptyMessage="No orders found"
        rowKey={(r) => r.id} onRowClick={(r) => router.push(`/orders/${r.id}`)} />
    </div>
  );
}
