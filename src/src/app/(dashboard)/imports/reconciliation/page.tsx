"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Scale } from "lucide-react";

export default function ReconciliationPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Reconciliation"
        description="Match and reconcile imported data against existing records"
        breadcrumbs={[
          { label: "Imports", href: "/imports" },
          { label: "Reconciliation" },
        ]}
      />

      <Card className="card-warm">
        <CardContent className="p-12 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center">
            <Scale size={24} className="text-muted-foreground/50" />
          </div>
          <div className="space-y-2 max-w-md">
            <h3 className="text-lg font-semibold tracking-tight font-[family-name:var(--font-heading)]">
              Import Reconciliation
            </h3>
            <p className="text-[13px] text-muted-foreground/70 leading-relaxed">
              Reconciliation features allow you to compare imported records
              against your existing data, identify discrepancies, and resolve
              conflicts. This module is under active development and will be
              available soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
