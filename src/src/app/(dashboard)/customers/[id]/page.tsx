"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactsPanel } from "@/components/customers/contacts-panel";
import { Timeline, type TimelineEvent } from "@/components/shared/timeline";
import { LoadingState } from "@/components/shared/states";

interface CustomerDetail {
  id: string;
  accountNumber: string;
  companyName: string;
  dba: string | null;
  type: string;
  status: string;
  creditLimit: number;
  currentBalance: number;
  paymentTerms: string;
  taxExempt: boolean;
  defaultDeliveryInstructions: string | null;
  notes: string | null;
  contacts: Array<{ id: string; firstName: string; lastName: string; email: string | null; phone: string | null; isPrimary: boolean; role: string | null }>;
  tags: Array<{ tag: string }>;
  orders: Array<{ id: string; orderNumber: string; type: string; status: string; totalAmount: number | null; requestedDate: string }>;
  collectionAccount: { status: string; agingCurrent: number; aging30: number; aging60: number; aging90: number; aging120Plus: number } | null;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params["id"] as string;
  const [customer, setCustomer] = React.useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/customers/${customerId}`);
        if (res.ok) setCustomer(await res.json());
      } finally { setIsLoading(false); }
    })();
  }, [customerId]);

  if (isLoading) return <LoadingState rows={5} />;
  if (!customer) return <div className="text-muted-foreground">Customer not found</div>;

  return (
    <div className="space-y-8">
      <PageHeader title={customer.companyName}
        description={`${customer.accountNumber} · ${customer.type} · ${customer.paymentTerms}`}
        breadcrumbs={[{ label: "Customers", href: "/customers" }, { label: customer.companyName }]}
        actions={<StatusBadge status={customer.status} />} />

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-warm"><CardContent className="pt-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">BALANCE</p>
          <p className="text-2xl font-light tracking-tight font-[family-name:var(--font-heading)]">${Number(customer.currentBalance).toLocaleString()}</p>
        </CardContent></Card>
        <Card className="card-warm"><CardContent className="pt-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">CREDIT LIMIT</p>
          <p className="text-2xl font-light tracking-tight font-[family-name:var(--font-heading)]">${Number(customer.creditLimit).toLocaleString()}</p>
        </CardContent></Card>
        <Card className="card-warm"><CardContent className="pt-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">ORDERS</p>
          <p className="text-2xl font-light tracking-tight font-[family-name:var(--font-heading)]">{customer.orders.length}</p>
        </CardContent></Card>
        <Card className="card-warm"><CardContent className="pt-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">CONTACTS</p>
          <p className="text-2xl font-light tracking-tight font-[family-name:var(--font-heading)]">{customer.contacts.length}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="bg-muted/30 border border-border/40 p-1 rounded-xl h-auto">
          <TabsTrigger value="profile" className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">Profile</TabsTrigger>
          <TabsTrigger value="contacts" className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">Contacts</TabsTrigger>
          <TabsTrigger value="orders" className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">Orders</TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">Billing</TabsTrigger>
          <TabsTrigger value="communications" className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">Communications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-5">
          <Card>
            <CardContent className="space-y-2 pt-4 text-sm">
              {customer.dba && <div className="flex justify-between"><span className="text-muted-foreground">DBA</span><span>{customer.dba}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Tax Exempt</span><span>{customer.taxExempt ? "Yes" : "No"}</span></div>
              {customer.defaultDeliveryInstructions && (
                <div><span className="text-muted-foreground block mb-1">Delivery Instructions</span><p className="bg-muted/30 rounded p-2 text-sm">{customer.defaultDeliveryInstructions}</p></div>
              )}
              {customer.notes && (
                <div><span className="text-muted-foreground block mb-1">Notes</span><p className="bg-muted/30 rounded p-2 text-sm">{customer.notes}</p></div>
              )}
              {customer.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap pt-2">
                  {customer.tags.map((t) => <span key={t.tag} className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{t.tag}</span>)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="mt-5">
          <ContactsPanel customerId={customerId} contacts={customer.contacts} />
        </TabsContent>

        <TabsContent value="orders" className="mt-5">
          <Card>
            <CardHeader><CardTitle className="text-base">Recent Orders</CardTitle></CardHeader>
            <CardContent>
              {customer.orders.length === 0 ? <p className="text-sm text-muted-foreground">No orders</p> : (
                <div className="space-y-2">
                  {customer.orders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div><span className="font-mono text-sm">{o.orderNumber}</span><span className="text-xs text-muted-foreground ml-2">{o.type}</span></div>
                      <div className="flex items-center gap-3">
                        {o.totalAmount && <span className="font-mono text-xs">${Number(o.totalAmount).toLocaleString()}</span>}
                        <StatusBadge status={o.status} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-5">
          <Card>
            <CardHeader><CardTitle className="text-base">Billing & Collections</CardTitle></CardHeader>
            <CardContent>
              {customer.collectionAccount ? (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><p className="text-xs text-muted-foreground">Current</p><p className="font-mono">${Number(customer.collectionAccount.agingCurrent).toLocaleString()}</p></div>
                  <div><p className="text-xs text-muted-foreground">30 Day</p><p className="font-mono">${Number(customer.collectionAccount.aging30).toLocaleString()}</p></div>
                  <div><p className="text-xs text-muted-foreground">60 Day</p><p className="font-mono">${Number(customer.collectionAccount.aging60).toLocaleString()}</p></div>
                  <div><p className="text-xs text-muted-foreground">90 Day</p><p className="font-mono">${Number(customer.collectionAccount.aging90).toLocaleString()}</p></div>
                  <div><p className="text-xs text-muted-foreground">120+ Day</p><p className="font-mono text-destructive">${Number(customer.collectionAccount.aging120Plus).toLocaleString()}</p></div>
                </div>
              ) : <p className="text-sm text-muted-foreground">No collection account</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications" className="mt-5">
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
            Communication log will be built in later phases
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
