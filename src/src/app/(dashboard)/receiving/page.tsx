"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";

interface ReceivingRow {
  id: string;
  purchaseOrderId: string;
  status: string;
  totalLinesExpected: number;
  totalLinesReceived: number;
  hasDiscrepancy: boolean;
  receivedAt: string;
}

const columns: DataTableColumn<ReceivingRow>[] = [
  { id: "po", header: "PO", cell: (r) => <span className="font-mono text-base">{r.purchaseOrderId.slice(0, 8)}</span>, sortable: true },
  { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} size="default" /> },
  { id: "lines", header: "Lines", cell: (r) => <span className="font-mono text-base">{r.totalLinesReceived}/{r.totalLinesExpected}</span>, className: "text-center" },
  { id: "discrepancy", header: "Discrepancy", cell: (r) => r.hasDiscrepancy
    ? <span className="text-sm text-destructive font-mono">YES</span>
    : <span className="text-sm text-muted-foreground">No</span> },
];

export default function ReceivingPage() {
  const router = useRouter();
  const [data, setData] = React.useState<ReceivingRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/receiving");
        if (res.ok) setData(await res.json());
      } finally { setIsLoading(false); }
    })();
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader title="Receiving" description="PO receiving and discrepancy management"
        breadcrumbs={[{ label: "Receiving" }]} />
      <DataTable columns={columns} data={data} total={data.length}
        isLoading={isLoading} emptyMessage="No receiving records"
        rowKey={(r) => r.id} onRowClick={(r) => router.push(`/receiving/${r.id}`)} />
    </div>
  );
}
