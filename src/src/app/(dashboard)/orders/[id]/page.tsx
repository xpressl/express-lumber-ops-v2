"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Timeline, type TimelineEvent } from "@/components/shared/timeline";
import { OrderStatusControls } from "@/components/orders/order-status-controls";
import { LoadingState } from "@/components/shared/states";
import { getNextStates } from "@/lib/state-machines/order";
import type { OrderStatus } from "@prisma/client";
import { format } from "date-fns";

interface OrderDetail {
  id: string;
  orderNumber: string;
  type: string;
  status: string;
  customer: { companyName: string; accountNumber: string; status: string };
  customerPO: string | null;
  requestedDate: string;
  totalAmount: number | null;
  totalWeight: number | null;
  totalPieces: number | null;
  readinessPercent: number;
  marginPercent: number | null;
  codFlag: boolean;
  codAmount: number | null;
  specialInstructions: string | null;
  holdReasons: string[];
  items: Array<{
    id: string; lineNumber: number; description: string; quantity: number; uom: string;
    unitPrice: number; unitCost: number; extendedPrice: number; readyStatus: string;
    product: { sku: string };
  }>;
  events: Array<{ id: string; fromStatus: string | null; toStatus: string; actorName: string; reason: string | null; createdAt: string }>;
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params["id"] as string;
  const [order, setOrder] = React.useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [transitioning, setTransitioning] = React.useState(false);

  const loadOrder = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) setOrder(await res.json());
    } finally { setIsLoading(false); }
  }, [orderId]);

  React.useEffect(() => { void loadOrder(); }, [loadOrder]);

  async function handleTransition(toStatus: string) {
    setTransitioning(true);
    try {
      await fetch(`/api/orders/${orderId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus }),
      });
      await loadOrder();
    } finally { setTransitioning(false); }
  }

  if (isLoading) return <LoadingState rows={6} />;
  if (!order) return <div className="text-muted-foreground">Order not found</div>;

  const nextStates = getNextStates(order.status as OrderStatus);
  const timelineEvents: TimelineEvent[] = order.events.map((e) => ({
    id: e.id,
    action: `${e.fromStatus ?? "—"} → ${e.toStatus}`,
    actorName: e.actorName,
    timestamp: e.createdAt,
  }));

  return (
    <div className="space-y-8">
      <PageHeader title={order.orderNumber}
        description={`${order.customer.companyName} · ${order.type} · ${format(new Date(order.requestedDate), "MMM d, yyyy")}`}
        breadcrumbs={[{ label: "Orders", href: "/orders" }, { label: order.orderNumber }]} />

      <OrderStatusControls currentStatus={order.status} nextStates={nextStates}
        onTransition={handleTransition} isLoading={transitioning} />

      {order.holdReasons.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3">
          <p className="text-sm font-medium text-destructive">Hold Reasons:</p>
          <ul className="text-sm text-destructive/80 mt-1">{order.holdReasons.map((r, i) => <li key={i}>- {r}</li>)}</ul>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="card-warm"><CardContent className="pt-4"><p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">AMOUNT</p><p className="text-2xl font-light tracking-tight font-[family-name:var(--font-heading)]">${order.totalAmount ? Number(order.totalAmount).toLocaleString() : "—"}</p></CardContent></Card>
        <Card className="card-warm"><CardContent className="pt-4"><p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">ITEMS</p><p className="text-2xl font-light tracking-tight font-[family-name:var(--font-heading)]">{order.items.length}</p></CardContent></Card>
        <Card className="card-warm"><CardContent className="pt-4"><p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">WEIGHT</p><p className="text-2xl font-light tracking-tight font-[family-name:var(--font-heading)]">{order.totalWeight ? `${Number(order.totalWeight).toLocaleString()} lbs` : "—"}</p></CardContent></Card>
        <Card className="card-warm"><CardContent className="pt-4"><p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">READY</p><p className={`text-2xl font-light tracking-tight font-[family-name:var(--font-heading)] ${order.readinessPercent === 100 ? "text-success" : "text-warning"}`}>{order.readinessPercent}%</p></CardContent></Card>
        {order.codFlag && <Card className="card-warm"><CardContent className="pt-4"><p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">COD</p><p className="text-2xl font-light tracking-tight font-[family-name:var(--font-heading)] text-warning">${order.codAmount ? Number(order.codAmount).toLocaleString() : "—"}</p></CardContent></Card>}
      </div>

      <Tabs defaultValue="items">
        <TabsList className="bg-muted/30 border border-border/40 p-1 rounded-xl h-auto">
          <TabsTrigger value="items" className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">Line Items</TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">Timeline</TabsTrigger>
          <TabsTrigger value="details" className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-5">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/30">
                  <th className="py-2 px-3 text-left text-[10px] font-mono uppercase text-muted-foreground">#</th>
                  <th className="py-2 px-3 text-left text-[10px] font-mono uppercase text-muted-foreground">SKU</th>
                  <th className="py-2 px-3 text-left text-[10px] font-mono uppercase text-muted-foreground">Description</th>
                  <th className="py-2 px-3 text-right text-[10px] font-mono uppercase text-muted-foreground">Qty</th>
                  <th className="py-2 px-3 text-right text-[10px] font-mono uppercase text-muted-foreground">Price</th>
                  <th className="py-2 px-3 text-right text-[10px] font-mono uppercase text-muted-foreground">Extended</th>
                  <th className="py-2 px-3 text-center text-[10px] font-mono uppercase text-muted-foreground">Ready</th>
                </tr></thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{item.lineNumber}</td>
                      <td className="py-2 px-3 font-mono text-xs">{item.product.sku}</td>
                      <td className="py-2 px-3">{item.description}</td>
                      <td className="py-2 px-3 text-right font-mono">{Number(item.quantity)} {item.uom}</td>
                      <td className="py-2 px-3 text-right font-mono">${Number(item.unitPrice).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-mono">${Number(item.extendedPrice).toLocaleString()}</td>
                      <td className="py-2 px-3 text-center"><StatusBadge status={item.readyStatus} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-5">
          <Card><CardHeader><CardTitle className="text-base">Order Events</CardTitle></CardHeader>
            <CardContent><Timeline events={timelineEvents} /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-5">
          <Card><CardContent className="space-y-2 pt-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Customer PO</span><span className="font-mono">{order.customerPO ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Customer Status</span><StatusBadge status={order.customer.status} size="sm" /></div>
            {order.specialInstructions && <div><span className="text-muted-foreground block mb-1">Special Instructions</span><p className="bg-muted/30 rounded p-2">{order.specialInstructions}</p></div>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
