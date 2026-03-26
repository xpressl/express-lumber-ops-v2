"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingState } from "@/components/shared/states";
import { MapPin, User, Users, AlertTriangle, Briefcase } from "lucide-react";

interface UnitDetail {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  description: string | null;
  head: { id: string; firstName: string; lastName: string } | null;
  location: { id: string; name: string; code: string } | null;
  parent: { id: string; name: string; code: string } | null;
  children: { id: string; name: string; type: string; head: { firstName: string; lastName: string } | null }[];
  roleTemplates: {
    id: string;
    title: string;
    criticality: string;
    targetHeadcount: number;
    status: string;
    requiredSkills: { skill: { name: string } }[];
  }[];
  coverageGaps: { id: string; gapType: string; severity: string; summary: string }[];
  hiringRequests: { id: string; urgency: string; status: string; reason: string; roleTemplate: { title: string } }[];
}

interface OrgDetailPanelProps {
  unitId: string | null;
  open: boolean;
  onClose: () => void;
}

export function OrgDetailPanel({ unitId, open, onClose }: OrgDetailPanelProps) {
  const [detail, setDetail] = React.useState<UnitDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!unitId || !open) return;
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    fetch(`/api/org-map/units/${unitId}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject("Failed")))
      .then((data) => setDetail(data))
      .catch((e) => {
        if (e !== "AbortError" && e?.name !== "AbortError")
          setError("Failed to load unit details");
      })
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, [unitId, open]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-[420px] sm:max-w-[420px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-mono">{detail?.name ?? "Unit Details"}</SheetTitle>
        </SheetHeader>

        {isLoading && <LoadingState rows={4} />}

        {error && <p className="text-sm text-destructive px-4 py-8 text-center">{error}</p>}

        {!isLoading && !error && detail && (
          <div className="space-y-4 px-4 pb-6">
            {/* Unit Info */}
            <Card>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <StatusBadge status={detail.type} size="sm" />
                  <StatusBadge status={detail.status} size="sm" />
                </div>
                <p className="text-[10px] font-mono text-muted-foreground tracking-wider">{detail.code}</p>
                {detail.description && <p className="text-sm text-muted-foreground">{detail.description}</p>}

                <div className="space-y-1.5 pt-1">
                  {detail.head && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <User size={12} className="text-muted-foreground/50" />
                      <span>Head: {detail.head.firstName} {detail.head.lastName}</span>
                    </div>
                  )}
                  {detail.location && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <MapPin size={12} className="text-muted-foreground/50" />
                      <span>{detail.location.name}</span>
                    </div>
                  )}
                  {detail.parent && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users size={12} className="text-muted-foreground/50" />
                      <span>Reports to: {detail.parent.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Direct Reports */}
            {detail.children.length > 0 && (
              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground/60">
                    Direct Reports ({detail.children.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-1">
                  {detail.children.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-xs py-1 border-b border-border/20 last:border-0">
                      <span className="font-medium">{c.name}</span>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={c.type} size="sm" />
                        {c.head && (
                          <span className="text-muted-foreground text-[10px]">
                            {c.head.firstName} {c.head.lastName}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Role Templates */}
            {detail.roleTemplates.length > 0 && (
              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground/60 flex items-center gap-1.5">
                    <Briefcase size={11} /> Roles ({detail.roleTemplates.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  {detail.roleTemplates.map((rt) => (
                    <div key={rt.id} className="p-2 rounded border border-border/30 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{rt.title}</span>
                        <StatusBadge status={rt.criticality} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                        <span>Headcount: {rt.targetHeadcount}</span>
                        <StatusBadge status={rt.status} size="sm" />
                      </div>
                      {rt.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {rt.requiredSkills.map((rs, i) => (
                            <span key={i} className="text-[9px] font-mono bg-muted px-1.5 py-0.5 rounded">
                              {rs.skill.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Coverage Gaps */}
            {detail.coverageGaps.length > 0 && (
              <Card className="border-destructive/20">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-[10px] font-mono uppercase tracking-[0.12em] text-destructive/70 flex items-center gap-1.5">
                    <AlertTriangle size={11} /> Coverage Gaps ({detail.coverageGaps.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-1.5">
                  {detail.coverageGaps.map((g) => (
                    <div key={g.id} className="flex items-start gap-2 text-xs py-1">
                      <StatusBadge status={g.severity} size="sm" />
                      <span>{g.summary}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Hiring Requests */}
            {detail.hiringRequests.length > 0 && (
              <Card className="border-primary/20">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-[10px] font-mono uppercase tracking-[0.12em] text-primary/70">
                    Hiring Requests ({detail.hiringRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-1.5">
                  {detail.hiringRequests.map((h) => (
                    <div key={h.id} className="flex items-start justify-between text-xs py-1 border-b border-border/20 last:border-0">
                      <div>
                        <span className="font-medium">{h.roleTemplate.title}</span>
                        <p className="text-muted-foreground text-[10px]">{h.reason}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <StatusBadge status={h.urgency} size="sm" />
                        <StatusBadge status={h.status} size="sm" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
