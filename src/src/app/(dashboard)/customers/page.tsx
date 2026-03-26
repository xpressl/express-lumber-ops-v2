"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CustomerRow {
  id: string;
  accountNumber: string;
  companyName: string;
  type: string;
  status: string;
  creditLimit: number;
  currentBalance: number;
  _count: { orders: number };
}

const columns: DataTableColumn<CustomerRow>[] = [
  { id: "account", header: "Account", cell: (r) => <span className="font-mono text-xs">{r.accountNumber}</span>, sortable: true },
  { id: "name", header: "Company", cell: (r) => <span className="font-medium">{r.companyName}</span>, sortable: true },
  { id: "type", header: "Type", cell: (r) => <span className="text-xs font-mono uppercase">{r.type}</span> },
  { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} size="sm" /> },
  { id: "balance", header: "Balance", cell: (r) => <span className="font-mono text-xs">${Number(r.currentBalance).toLocaleString()}</span>, className: "text-right" },
  { id: "limit", header: "Credit Limit", cell: (r) => <span className="font-mono text-xs">${Number(r.creditLimit).toLocaleString()}</span>, className: "text-right" },
  { id: "orders", header: "Orders", accessorFn: (r) => r._count.orders, className: "text-center font-mono" },
];

export default function CustomersPage() {
  const router = useRouter();
  const [data, setData] = React.useState<CustomerRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchCustomers = React.useCallback(async (p = 1, search?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/customers?${params}`);
      if (res.ok) { const json = await res.json(); setData(json.data); setTotal(json.total); }
    } finally { setIsLoading(false); }
  }, []);

  React.useEffect(() => { void fetchCustomers(); }, [fetchCustomers]);

  return (
    <div className="space-y-8">
      <PageHeader title="Customers" description="Customer directory and account management"
        breadcrumbs={[{ label: "Customers" }]}
        actions={<Button className="rounded-lg gap-2 font-medium text-[13px] h-9 px-4"><Plus size={15} />New Customer</Button>} />

      <DataTable columns={columns} data={data} total={total} page={page}
        totalPages={Math.ceil(total / 20)}
        onPageChange={(p) => { setPage(p); void fetchCustomers(p); }}
        onSearch={(q) => void fetchCustomers(1, q)}
        searchPlaceholder="Search by name, account#..."
        isLoading={isLoading} emptyMessage="No customers found"
        rowKey={(r) => r.id} onRowClick={(r) => router.push(`/customers/${r.id}`)} />
    </div>
  );
}
