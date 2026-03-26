"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { KPICard } from "@/components/shared/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, Layers, FileText } from "lucide-react";

interface EstimateLine {
  id: string;
  description: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  extendedPrice: number;
}

interface EstimateDetail {
  id: string;
  estimateNumber: string;
  jobName: string | null;
  status: string;
  totalAmount: number;
  customerName: string;
  lines: EstimateLine[];
}

export default function EstimateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [estimate, setEstimate] = React.useState<EstimateDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/crm/estimates/${id}`);
        if (!res.ok) {
          setError(true);
          return;
        }
        setEstimate(await res.json());
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Estimate Not Found"
          breadcrumbs={[
            { label: "CRM", href: "/crm" },
            { label: "Estimates", href: "/crm" },
          ]}
        />
        <Card className="card-warm">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground text-sm">
              The requested estimate could not be found or failed to load.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Estimate ${estimate.estimateNumber}`}
        description={estimate.jobName ?? estimate.customerName}
        breadcrumbs={[
          { label: "CRM", href: "/crm" },
          { label: "Estimates", href: "/crm" },
          { label: estimate.estimateNumber },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Total Amount"
          value={`$${Number(estimate.totalAmount).toLocaleString()}`}
          icon={DollarSign}
          accent="copper"
        />
        <KPICard
          title="Line Items"
          value={estimate.lines.length}
          icon={Layers}
          accent="default"
        />
        <Card className="card-warm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary/30" />
          <CardContent className="p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">
              Status
            </p>
            <div className="mt-3">
              <StatusBadge status={estimate.status} size="lg" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-warm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText size={15} className="text-muted-foreground/60" />
            Line Items
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-b-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-border/40">
                  <TableHead className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60 h-10 px-4">
                    Description
                  </TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60 h-10 px-4 text-right">
                    Qty
                  </TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60 h-10 px-4 text-center">
                    UOM
                  </TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60 h-10 px-4 text-right">
                    Unit Price
                  </TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60 h-10 px-4 text-right">
                    Ext. Price
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimate.lines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground/50 text-[13px]">
                      No line items
                    </TableCell>
                  </TableRow>
                ) : (
                  estimate.lines.map((line) => (
                    <TableRow key={line.id} className="border-b border-border/20 last:border-0">
                      <TableCell className="text-[13px] px-4 py-3">
                        {line.description}
                      </TableCell>
                      <TableCell className="text-[13px] px-4 py-3 text-right font-mono tabular-nums">
                        {line.quantity}
                      </TableCell>
                      <TableCell className="text-[13px] px-4 py-3 text-center text-muted-foreground">
                        {line.uom}
                      </TableCell>
                      <TableCell className="text-[13px] px-4 py-3 text-right font-mono tabular-nums">
                        ${Number(line.unitPrice).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-[13px] px-4 py-3 text-right font-mono tabular-nums font-medium">
                        ${Number(line.extendedPrice).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
