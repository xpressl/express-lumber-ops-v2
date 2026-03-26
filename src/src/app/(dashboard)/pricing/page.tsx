"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CostChangeRow { id: string; product: { sku: string; name: string; currentSell: number }; oldCost: number; newCost: number; changePercent: number; source: string; effectiveAt: string }

const columns: DataTableColumn<CostChangeRow>[] = [
  { id: "sku", header: "SKU", cell: (r) => <span className="font-mono text-xs">{r.product.sku}</span>, sortable: true },
  { id: "product", header: "Product", cell: (r) => <span className="text-sm">{r.product.name}</span> },
  { id: "old", header: "Old Cost", cell: (r) => <span className="font-mono text-xs">${Number(r.oldCost).toFixed(4)}</span>, className: "text-right" },
  { id: "new", header: "New Cost", cell: (r) => <span className="font-mono text-xs">${Number(r.newCost).toFixed(4)}</span>, className: "text-right" },
  { id: "change", header: "Change", cell: (r) => {
    const pct = Number(r.changePercent);
    return <span className={`font-mono text-xs ${pct > 0 ? "text-destructive" : "text-success"}`}>{pct > 0 ? "+" : ""}{pct.toFixed(1)}%</span>;
  }, className: "text-right", sortable: true },
  { id: "source", header: "Source", accessorFn: (r) => r.source, className: "text-xs" },
];

export default function PricingPage() {
  const [changes, setChanges] = React.useState<CostChangeRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try { const r = await fetch("/api/pricing"); if (r.ok) setChanges(await r.json()); } finally { setIsLoading(false); }
    })();
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader title="Pricing" description="Cost changes, margin control, and quote risk"
        breadcrumbs={[{ label: "Pricing" }]} />
      <Tabs defaultValue="changes">
        <TabsList className="bg-muted/30 border border-border/40 p-1 rounded-xl h-auto">
          <TabsTrigger value="changes" className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">Cost Changes ({changes.length})</TabsTrigger>
          <TabsTrigger value="quotes" className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">Quotes at Risk</TabsTrigger>
        </TabsList>
        <TabsContent value="changes" className="mt-5">
          <DataTable columns={columns} data={changes} total={changes.length} isLoading={isLoading}
            emptyMessage="No recent cost changes" rowKey={(r) => r.id} />
        </TabsContent>
        <TabsContent value="quotes" className="mt-5 text-center text-muted-foreground text-sm py-8">
          Quotes affected by recent cost changes will appear here.
        </TabsContent>
      </Tabs>
    </div>
  );
}
