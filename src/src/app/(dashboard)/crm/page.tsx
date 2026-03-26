"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { NewLeadDialog } from "@/components/crm/new-lead-dialog";

interface LeadRow { id: string; companyName: string; contactName: string; status: string; source: string | null; createdAt: string }
interface EstimateRow { id: string; estimateNumber: string; jobName: string | null; status: string; totalAmount: number; _count: { lines: number }; createdAt: string }

const leadColumns: DataTableColumn<LeadRow>[] = [
  { id: "company", header: "Company", cell: (r) => <span className="font-medium">{r.companyName}</span>, sortable: true },
  { id: "contact", header: "Contact", accessorFn: (r) => r.contactName },
  { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} size="sm" /> },
  { id: "source", header: "Source", accessorFn: (r) => r.source ?? "\u2014", className: "text-xs" },
];

const estimateColumns: DataTableColumn<EstimateRow>[] = [
  { id: "number", header: "Estimate #", cell: (r) => <span className="font-mono text-xs">{r.estimateNumber}</span>, sortable: true },
  { id: "job", header: "Job", accessorFn: (r) => r.jobName ?? "\u2014" },
  { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} size="sm" /> },
  { id: "amount", header: "Amount", cell: (r) => <span className="font-mono text-xs">${Number(r.totalAmount).toLocaleString()}</span>, className: "text-right" },
  { id: "lines", header: "Lines", accessorFn: (r) => r._count.lines, className: "text-center font-mono" },
];

export default function CRMPage() {
  const router = useRouter();
  const { defaultLocationId } = useAuth();
  const [leads, setLeads] = React.useState<LeadRow[]>([]);
  const [estimates, setEstimates] = React.useState<EstimateRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [l, e] = await Promise.all([fetch("/api/crm/leads"), fetch("/api/crm/estimates")]);
      if (l.ok) setLeads(await l.json());
      if (e.ok) setEstimates(await e.json());
    } finally { setIsLoading(false); }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-8">
      <PageHeader title="CRM" description="Leads, estimates, and revenue recovery"
        breadcrumbs={[{ label: "CRM" }]}
        actions={
          <Button
            className="rounded-lg gap-2 font-medium text-[13px] h-9 px-4"
            onClick={() => setDialogOpen(true)}
          >
            <Plus size={15} />New Lead
          </Button>
        } />

      <Tabs defaultValue="leads">
        <TabsList className="bg-muted/30 border border-border/40 p-1 rounded-xl h-auto">
          <TabsTrigger value="leads" className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">Leads ({leads.length})</TabsTrigger>
          <TabsTrigger value="estimates" className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">Estimates ({estimates.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="leads" className="mt-5">
          <DataTable columns={leadColumns} data={leads} total={leads.length} isLoading={isLoading}
            searchPlaceholder="Search leads..." emptyMessage="No leads" rowKey={(r) => r.id}
            onRowClick={(r) => router.push(`/crm/leads/${r.id}`)} />
        </TabsContent>
        <TabsContent value="estimates" className="mt-5">
          <DataTable columns={estimateColumns} data={estimates} total={estimates.length} isLoading={isLoading}
            emptyMessage="No estimates" rowKey={(r) => r.id}
            onRowClick={(r) => router.push(`/crm/estimates/${r.id}`)} />
        </TabsContent>
      </Tabs>

      <NewLeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchData}
        locationId={defaultLocationId ?? ""}
      />
    </div>
  );
}
