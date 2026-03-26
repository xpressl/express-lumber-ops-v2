"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";

interface DormantRow { id: string; companyName: string; accountNumber: string; _count: { orders: number } }

const columns: DataTableColumn<DormantRow>[] = [
  { id: "account", header: "Account", cell: (r) => <span className="font-mono text-xs">{r.accountNumber}</span> },
  { id: "name", header: "Company", cell: (r) => <span className="font-medium">{r.companyName}</span>, sortable: true },
  { id: "orders", header: "Past Orders", accessorFn: (r) => r._count.orders, className: "text-center font-mono" },
];

export default function DormantPage() {
  const [data, setData] = React.useState<DormantRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try { const r = await fetch("/api/crm/follow-ups?view=dormant"); if (r.ok) setData(await r.json()); } finally { setIsLoading(false); }
    })();
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader title="Dormant Accounts" description="Active customers with no orders in 90+ days"
        breadcrumbs={[{ label: "CRM", href: "/crm" }, { label: "Dormant" }]} />
      <DataTable columns={columns} data={data} total={data.length} isLoading={isLoading}
        emptyMessage="No dormant accounts" rowKey={(r) => r.id} />
    </div>
  );
}
