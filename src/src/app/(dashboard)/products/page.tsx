"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  uom: string;
  currentCost: number;
  currentSell: number;
  marginPercent: number | null;
  status: string;
  primaryVendor: { name: string } | null;
  category: { name: string } | null;
}

const columns: DataTableColumn<ProductRow>[] = [
  { id: "sku", header: "SKU", cell: (r) => <span className="font-mono text-xs font-medium">{r.sku}</span>, sortable: true },
  { id: "name", header: "Product", cell: (r) => <span className="text-sm">{r.name}</span>, sortable: true },
  { id: "uom", header: "UOM", accessorFn: (r) => r.uom, className: "font-mono text-xs text-center" },
  { id: "cost", header: "Cost", cell: (r) => <span className="font-mono text-xs">${Number(r.currentCost).toFixed(2)}</span>, className: "text-right", sortable: true },
  { id: "sell", header: "Sell", cell: (r) => <span className="font-mono text-xs">${Number(r.currentSell).toFixed(2)}</span>, className: "text-right", sortable: true },
  { id: "margin", header: "Margin", cell: (r) => {
    const m = r.marginPercent ? Number(r.marginPercent) : 0;
    return <span className={`font-mono text-xs ${m < 15 ? "text-destructive" : m < 25 ? "text-warning" : "text-success"}`}>{m.toFixed(1)}%</span>;
  }, className: "text-right" },
  { id: "vendor", header: "Vendor", accessorFn: (r) => r.primaryVendor?.name ?? "—", className: "text-xs" },
  { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} size="sm" /> },
];

export default function ProductsPage() {
  const router = useRouter();
  const [data, setData] = React.useState<ProductRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetch_ = React.useCallback(async (p = 1, search?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/products?${params}`);
      if (res.ok) { const json = await res.json(); setData(json.data); setTotal(json.total); }
    } finally { setIsLoading(false); }
  }, []);

  React.useEffect(() => { void fetch_(); }, [fetch_]);

  return (
    <div className="space-y-8">
      <PageHeader title="Product Catalogue" description="Products with cost, sell price, margin, and vendor info"
        breadcrumbs={[{ label: "Products" }]} />
      <DataTable columns={columns} data={data} total={total} page={page}
        totalPages={Math.ceil(total / 20)}
        onPageChange={(p) => { setPage(p); void fetch_(p); }}
        onSearch={(q) => void fetch_(1, q)}
        searchPlaceholder="Search by SKU, name..." isLoading={isLoading}
        emptyMessage="No products found" rowKey={(r) => r.id}
        onRowClick={(r) => router.push(`/products/${r.id}`)} />
    </div>
  );
}
