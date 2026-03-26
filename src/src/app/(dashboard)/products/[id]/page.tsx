"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingState } from "@/components/shared/states";

interface ProductDetail {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  uom: string;
  isRandomLength: boolean;
  currentCost: number;
  currentSell: number;
  marginPercent: number | null;
  status: string;
  category: { name: string } | null;
  primaryVendor: { name: string; code: string } | null;
  costHistory: Array<{ id: string; oldCost: number; newCost: number; changePercent: number; source: string; effectiveAt: string }>;
  vendorPrices: Array<{ id: string; unitCost: number; effectiveDate: string; vendor: { name: string } }>;
  inventoryBalances: Array<{ locationId: string; onHand: number; allocated: number; available: number }>;
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = params["id"] as string;
  const [product, setProduct] = React.useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) setProduct(await res.json());
      } finally { setIsLoading(false); }
    })();
  }, [id]);

  if (isLoading) return <LoadingState rows={5} />;
  if (!product) return <div className="text-muted-foreground">Product not found</div>;

  const margin = product.marginPercent ? Number(product.marginPercent) : 0;

  return (
    <div className="space-y-8">
      <PageHeader title={product.name}
        description={`${product.sku} · ${product.uom}${product.isRandomLength ? " · Random Length" : ""}`}
        breadcrumbs={[{ label: "Products", href: "/products" }, { label: product.sku }]}
        actions={<StatusBadge status={product.status} />} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-warm"><CardContent className="pt-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">COST</p>
          <p className="text-2xl font-light tracking-tight font-[family-name:var(--font-heading)]">${Number(product.currentCost).toFixed(4)}</p>
        </CardContent></Card>
        <Card className="card-warm"><CardContent className="pt-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">SELL</p>
          <p className="text-2xl font-light tracking-tight font-[family-name:var(--font-heading)]">${Number(product.currentSell).toFixed(2)}</p>
        </CardContent></Card>
        <Card className="card-warm"><CardContent className="pt-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">MARGIN</p>
          <p className={`text-2xl font-light tracking-tight font-[family-name:var(--font-heading)] ${margin < 15 ? "text-destructive" : margin < 25 ? "text-warning" : "text-success"}`}>{margin.toFixed(1)}%</p>
        </CardContent></Card>
        <Card className="card-warm"><CardContent className="pt-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">VENDOR</p>
          <p className="text-2xl font-light tracking-tight font-[family-name:var(--font-heading)]">{product.primaryVendor?.name ?? "—"}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="bg-muted/30 border border-border/40 p-1 rounded-xl h-auto">
          <TabsTrigger value="details" className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">Details</TabsTrigger>
          <TabsTrigger value="cost-history" className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">Cost History</TabsTrigger>
          <TabsTrigger value="vendor-prices" className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">Vendor Prices</TabsTrigger>
          <TabsTrigger value="inventory" className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-5">
          <Card><CardContent className="space-y-2 pt-4 text-sm">
            {product.description && <div><span className="text-muted-foreground">Description:</span> {product.description}</div>}
            <div><span className="text-muted-foreground">Category:</span> {product.category?.name ?? "Uncategorized"}</div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="cost-history" className="mt-5">
          <Card><CardHeader><CardTitle className="text-base">Cost Changes</CardTitle></CardHeader>
            <CardContent>
              {product.costHistory.length === 0 ? <p className="text-sm text-muted-foreground">No cost changes</p> : (
                <div className="space-y-2">
                  {product.costHistory.map((ch) => (
                    <div key={ch.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                      <div className="font-mono text-xs">
                        <span className="text-destructive">${Number(ch.oldCost).toFixed(4)}</span>
                        <span className="mx-1">→</span>
                        <span className="text-success">${Number(ch.newCost).toFixed(4)}</span>
                        <span className={`ml-2 ${Number(ch.changePercent) > 0 ? "text-destructive" : "text-success"}`}>
                          ({Number(ch.changePercent) > 0 ? "+" : ""}{Number(ch.changePercent).toFixed(1)}%)
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{ch.source}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendor-prices" className="mt-5">
          <Card><CardHeader><CardTitle className="text-base">Active Vendor Prices</CardTitle></CardHeader>
            <CardContent>
              {product.vendorPrices.length === 0 ? <p className="text-sm text-muted-foreground">No vendor prices</p> : (
                <div className="space-y-2">
                  {product.vendorPrices.map((vp) => (
                    <div key={vp.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                      <span className="text-sm">{vp.vendor.name}</span>
                      <span className="font-mono text-xs">${Number(vp.unitCost).toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="mt-5">
          <Card><CardHeader><CardTitle className="text-base">Inventory by Location</CardTitle></CardHeader>
            <CardContent>
              {product.inventoryBalances.length === 0 ? <p className="text-sm text-muted-foreground">No inventory data</p> : (
                <div className="space-y-2">
                  {product.inventoryBalances.map((ib) => (
                    <div key={ib.locationId} className="grid grid-cols-4 gap-4 py-1.5 border-b border-border last:border-0 font-mono text-xs">
                      <span>{ib.locationId.slice(0, 8)}</span>
                      <span>On Hand: {Number(ib.onHand)}</span>
                      <span>Allocated: {Number(ib.allocated)}</span>
                      <span className="text-success">Available: {Number(ib.available)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
