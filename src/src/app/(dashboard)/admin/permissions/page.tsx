"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingState } from "@/components/shared/states";

interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
  action: string;
}

export default function PermissionCatalogPage() {
  const [permissions, setPermissions] = React.useState<Permission[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // TODO: Create dedicated /api/permissions endpoint
    // For now, we'll show a static catalog from seed data
    setIsLoading(false);
    setPermissions([]); // Will be populated when API exists
  }, []);

  // Group by module
  const grouped: Record<string, Permission[]> = {};
  for (const p of permissions) {
    if (!grouped[p.module]) grouped[p.module] = [];
    grouped[p.module]!.push(p);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permission Catalog"
        description="Reference of all system permissions organized by module"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Permissions" }]}
      />

      {isLoading ? (
        <LoadingState rows={5} />
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p className="text-sm">Permission catalog will be populated from the database.</p>
            <p className="text-xs mt-1 font-mono">69 permissions across 12 modules defined in seed data.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([module, perms]) => (
          <Card key={module}>
            <CardHeader>
              <CardTitle className="text-base font-mono uppercase">{module}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {perms.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30">
                    <div>
                      <span className="text-sm">{p.name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground ml-2">{p.code}</span>
                    </div>
                    <StatusBadge status={p.action} size="sm" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
