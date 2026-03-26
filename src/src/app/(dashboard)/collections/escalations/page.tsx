"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";

interface AccountRow {
  id: string;
  customer: { companyName: string; accountNumber: string };
  status: string;
  currentBalance: number;
  agingCurrent: number;
  aging30: number;
  aging60: number;
  aging90: number;
  aging120Plus: number;
  nextActionDate: string | null;
  holdRecommended: boolean;
}

const columns: DataTableColumn<AccountRow>[] = [
  {
    id: "customer",
    header: "Customer",
    cell: (r) => (
      <div>
        <span className="font-medium text-sm">{r.customer.companyName}</span>
        <span className="text-[10px] font-mono text-muted-foreground ml-2">{r.customer.accountNumber}</span>
      </div>
    ),
    sortable: true,
  },
  {
    id: "status",
    header: "Status",
    cell: (r) => <StatusBadge status={r.status} size="sm" />,
  },
  {
    id: "balance",
    header: "Balance",
    cell: (r) => <span className="font-mono text-xs">${Number(r.currentBalance).toLocaleString()}</span>,
    className: "text-right",
    sortable: true,
  },
  {
    id: "current",
    header: "Current",
    cell: (r) => <span className="font-mono text-xs">${Number(r.agingCurrent).toLocaleString()}</span>,
    className: "text-right",
  },
  {
    id: "30",
    header: "30 Day",
    cell: (r) => <span className="font-mono text-xs">${Number(r.aging30).toLocaleString()}</span>,
    className: "text-right",
  },
  {
    id: "60",
    header: "60 Day",
    cell: (r) => (
      <span className={`font-mono text-xs ${Number(r.aging60) > 0 ? "text-warning" : ""}`}>
        ${Number(r.aging60).toLocaleString()}
      </span>
    ),
    className: "text-right",
  },
  {
    id: "90+",
    header: "90+ Day",
    cell: (r) => {
      const total = Number(r.aging90) + Number(r.aging120Plus);
      return (
        <span className={`font-mono text-xs ${total > 0 ? "text-destructive font-medium" : ""}`}>
          ${total.toLocaleString()}
        </span>
      );
    },
    className: "text-right",
  },
  {
    id: "hold",
    header: "",
    cell: (r) => r.holdRecommended ? <span className="text-[10px] font-mono text-destructive">HOLD REC</span> : null,
  },
];

export default function EscalationsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = React.useState<AccountRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/collections?status=ESCALATED");
        if (res.ok) {
          const data = await res.json();
          setAccounts(data.accounts ?? data);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Escalated Accounts"
        description="Accounts requiring immediate attention"
        breadcrumbs={[
          { label: "Collections", href: "/collections" },
          { label: "Escalations" },
        ]}
      />

      <DataTable
        columns={columns}
        data={accounts}
        total={accounts.length}
        isLoading={isLoading}
        searchPlaceholder="Search escalated accounts..."
        emptyMessage="No escalated accounts"
        rowKey={(r) => r.id}
        onRowClick={(r) => router.push(`/collections/accounts/${r.id}`)}
      />
    </div>
  );
}
