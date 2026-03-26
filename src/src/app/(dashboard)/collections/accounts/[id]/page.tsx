"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { KPICard } from "@/components/shared/kpi-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingState } from "@/components/shared/states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Clock,
  Calendar,
  AlertTriangle,
  TrendingDown,
} from "lucide-react";

interface CallRecord {
  id: string;
  type: string;
  outcome: string;
  notes: string;
  createdAt: string;
}

interface PromiseRecord {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
}

interface DisputeRecord {
  id: string;
  reason: string;
  amount: number;
  status: string;
}

interface CollectionAccountDetail {
  id: string;
  customer: { companyName: string; accountNumber: string };
  status: string;
  currentBalance: number;
  agingCurrent: number;
  aging30: number;
  aging60: number;
  aging90: number;
  aging120Plus: number;
  calls: CallRecord[];
  promises: PromiseRecord[];
  disputes: DisputeRecord[];
}

export default function CollectionAccountDetailPage() {
  const params = useParams();
  const accountId = params["id"] as string;
  const [account, setAccount] = React.useState<CollectionAccountDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/collections/accounts/${accountId}`);
        if (res.ok) setAccount(await res.json());
      } finally {
        setIsLoading(false);
      }
    })();
  }, [accountId]);

  if (isLoading) return <LoadingState rows={5} />;
  if (!account) return <div className="text-muted-foreground">Account not found</div>;

  const ninetyPlus = Number(account.aging90) + Number(account.aging120Plus);

  return (
    <div className="space-y-8">
      <PageHeader
        title={account.customer.companyName}
        description={`${account.customer.accountNumber} · Collection Account`}
        breadcrumbs={[
          { label: "Collections", href: "/collections" },
          { label: account.customer.companyName },
        ]}
        actions={<StatusBadge status={account.status} />}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard title="Balance" value={`$${Number(account.currentBalance).toLocaleString()}`} icon={DollarSign} />
        <KPICard title="Current" value={`$${Number(account.agingCurrent).toLocaleString()}`} icon={Clock} />
        <KPICard title="30 Day" value={`$${Number(account.aging30).toLocaleString()}`} icon={Calendar} />
        <KPICard title="60 Day" value={`$${Number(account.aging60).toLocaleString()}`} icon={AlertTriangle} accent={Number(account.aging60) > 0 ? "warning" : "default"} />
        <KPICard title="90+ Day" value={`$${ninetyPlus.toLocaleString()}`} icon={TrendingDown} accent={ninetyPlus > 0 ? "destructive" : "default"} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-muted/30 border border-border/40 p-1 rounded-xl h-auto">
          <TabsTrigger value="overview" className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">Overview</TabsTrigger>
          <TabsTrigger value="calls" className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">Calls</TabsTrigger>
          <TabsTrigger value="promises" className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">Promises</TabsTrigger>
          <TabsTrigger value="disputes" className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">Disputes</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="mt-5">
          <Card className="card-warm">
            <CardHeader><CardTitle className="text-base">Aging Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">Current</p>
                  <p className="text-xl font-light font-[family-name:var(--font-heading)] mt-1">${Number(account.agingCurrent).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">30 Day</p>
                  <p className="text-xl font-light font-[family-name:var(--font-heading)] mt-1">${Number(account.aging30).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">60 Day</p>
                  <p className="text-xl font-light font-[family-name:var(--font-heading)] mt-1 text-warning">${Number(account.aging60).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">90 Day</p>
                  <p className="text-xl font-light font-[family-name:var(--font-heading)] mt-1 text-destructive">${Number(account.aging90).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">120+ Day</p>
                  <p className="text-xl font-light font-[family-name:var(--font-heading)] mt-1 text-destructive font-medium">${Number(account.aging120Plus).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calls tab */}
        <TabsContent value="calls" className="mt-5">
          <Card className="card-warm">
            <CardHeader><CardTitle className="text-base">Call History</CardTitle></CardHeader>
            <CardContent>
              {account.calls.length === 0 ? (
                <p className="text-sm text-muted-foreground">No calls recorded</p>
              ) : (
                <div className="space-y-3">
                  {account.calls.map((call) => (
                    <div key={call.id} className="flex items-start justify-between py-3 border-b border-border/40 last:border-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{call.type}</span>
                          <StatusBadge status={call.outcome} size="sm" />
                        </div>
                        {call.notes && (
                          <p className="text-[12px] text-muted-foreground/70 leading-relaxed">{call.notes}</p>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground/60 shrink-0 ml-4">
                        {new Date(call.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promises tab */}
        <TabsContent value="promises" className="mt-5">
          <Card className="card-warm">
            <CardHeader><CardTitle className="text-base">Payment Promises</CardTitle></CardHeader>
            <CardContent>
              {account.promises.length === 0 ? (
                <p className="text-sm text-muted-foreground">No promises recorded</p>
              ) : (
                <div className="space-y-3">
                  {account.promises.map((promise) => (
                    <div key={promise.id} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-medium">
                          ${Number(promise.amount).toLocaleString()}
                        </span>
                        <span className="text-[12px] text-muted-foreground/70">
                          Due {new Date(promise.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <StatusBadge status={promise.status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disputes tab */}
        <TabsContent value="disputes" className="mt-5">
          <Card className="card-warm">
            <CardHeader><CardTitle className="text-base">Disputes</CardTitle></CardHeader>
            <CardContent>
              {account.disputes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No disputes recorded</p>
              ) : (
                <div className="space-y-3">
                  {account.disputes.map((dispute) => (
                    <div key={dispute.id} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
                      <div className="space-y-1">
                        <span className="text-sm font-medium">{dispute.reason}</span>
                        <p className="text-[12px] font-mono text-muted-foreground/70">
                          ${Number(dispute.amount).toLocaleString()}
                        </p>
                      </div>
                      <StatusBadge status={dispute.status} size="sm" />
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
