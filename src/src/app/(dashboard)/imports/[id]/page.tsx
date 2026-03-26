"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { KPICard } from "@/components/shared/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Gauge,
  ArrowRight,
} from "lucide-react";

interface FieldMapping {
  source: string;
  target: string;
  confidence: number;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface ImportDetail {
  id: string;
  type: string;
  fileName: string;
  status: string;
  totalRows: number;
  createdRows: number;
  errorRows: number;
  confidenceScore: number | null;
  fieldMappings: FieldMapping[];
  errors: ImportError[];
}

export default function ImportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [importData, setImportData] = React.useState<ImportDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/imports/${id}`);
        if (!res.ok) {
          setError(true);
          return;
        }
        setImportData(await res.json());
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
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !importData) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Import Not Found"
          breadcrumbs={[{ label: "Imports", href: "/imports" }]}
        />
        <Card className="card-warm">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground text-sm">
              The requested import could not be found or failed to load.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const confidencePercent =
    importData.confidenceScore !== null
      ? (Number(importData.confidenceScore) * 100).toFixed(0)
      : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title={importData.fileName}
        description={`${importData.type} import`}
        breadcrumbs={[
          { label: "Imports", href: "/imports" },
          { label: importData.fileName },
        ]}
        actions={<StatusBadge status={importData.status} size="lg" />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Rows"
          value={importData.totalRows}
          icon={FileSpreadsheet}
          accent="default"
        />
        <KPICard
          title="Created"
          value={importData.createdRows}
          icon={CheckCircle2}
          accent="success"
        />
        <KPICard
          title="Errors"
          value={importData.errorRows}
          icon={AlertTriangle}
          accent={importData.errorRows > 0 ? "destructive" : "success"}
        />
        <KPICard
          title="Confidence"
          value={confidencePercent ? `${confidencePercent}%` : "\u2014"}
          icon={Gauge}
          accent={
            importData.confidenceScore !== null &&
            Number(importData.confidenceScore) >= 0.85
              ? "success"
              : importData.confidenceScore !== null &&
                  Number(importData.confidenceScore) >= 0.7
                ? "warning"
                : "destructive"
          }
        />
      </div>

      <Tabs defaultValue="mappings">
        <TabsList className="bg-muted/30 border border-border/40 p-1 rounded-xl h-auto">
          <TabsTrigger
            value="mappings"
            className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
          >
            Mappings
            <span className="ml-2 text-[11px] font-mono text-muted-foreground tabular-nums">
              {importData.fieldMappings.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="errors"
            className="rounded-lg text-[13px] px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
          >
            Errors
            <span className="ml-2 text-[11px] font-mono text-muted-foreground tabular-nums">
              {importData.errors.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mappings" className="mt-5">
          <Card className="card-warm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Field Mappings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-b-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-border/40">
                      <TableHead className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60 h-10 px-4">
                        Source Field
                      </TableHead>
                      <TableHead className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60 h-10 px-4 w-10" />
                      <TableHead className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60 h-10 px-4">
                        Target Field
                      </TableHead>
                      <TableHead className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60 h-10 px-4 text-right">
                        Confidence
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importData.fieldMappings.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="h-24 text-center text-muted-foreground/50 text-[13px]"
                        >
                          No field mappings
                        </TableCell>
                      </TableRow>
                    ) : (
                      importData.fieldMappings.map((mapping, i) => {
                        const pct = (Number(mapping.confidence) * 100).toFixed(0);
                        const color =
                          Number(mapping.confidence) >= 0.85
                            ? "text-success"
                            : Number(mapping.confidence) >= 0.7
                              ? "text-warning"
                              : "text-destructive";
                        return (
                          <TableRow
                            key={i}
                            className="border-b border-border/20 last:border-0"
                          >
                            <TableCell className="text-[13px] px-4 py-3 font-mono">
                              {mapping.source}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <ArrowRight
                                size={14}
                                className="text-muted-foreground/40"
                              />
                            </TableCell>
                            <TableCell className="text-[13px] px-4 py-3 font-mono font-medium">
                              {mapping.target}
                            </TableCell>
                            <TableCell
                              className={`text-[13px] px-4 py-3 text-right font-mono tabular-nums ${color}`}
                            >
                              {pct}%
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="mt-5">
          <Card className="card-warm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Import Errors
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-b-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-border/40">
                      <TableHead className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60 h-10 px-4 w-20">
                        Row #
                      </TableHead>
                      <TableHead className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60 h-10 px-4">
                        Field
                      </TableHead>
                      <TableHead className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60 h-10 px-4">
                        Message
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importData.errors.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="h-24 text-center text-muted-foreground/50 text-[13px]"
                        >
                          No errors found
                        </TableCell>
                      </TableRow>
                    ) : (
                      importData.errors.map((err, i) => (
                        <TableRow
                          key={i}
                          className="border-b border-border/20 last:border-0"
                        >
                          <TableCell className="text-[13px] px-4 py-3 font-mono tabular-nums text-muted-foreground">
                            {err.row}
                          </TableCell>
                          <TableCell className="text-[13px] px-4 py-3 font-mono font-medium">
                            {err.field}
                          </TableCell>
                          <TableCell className="text-[13px] px-4 py-3 text-destructive">
                            {err.message}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
