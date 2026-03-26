"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/states";

interface BranchSetting {
  id: string;
  locationId: string;
  key: string;
  value: unknown;
  category: string;
  description: string | null;
}

export default function BranchSettingsPage() {
  const [settings, setSettings] = React.useState<BranchSetting[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings/branch");
        if (res.ok) setSettings(await res.json());
      } finally { setIsLoading(false); }
    })();
  }, []);

  const grouped: Record<string, BranchSetting[]> = {};
  for (const s of settings) {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category]!.push(s);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Branch Settings"
        description="Configure branch-specific operational settings"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Settings" }]}
      />

      {isLoading ? <LoadingState rows={5} /> : settings.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">
          No branch settings configured yet. Settings will be populated during module rollout.
        </CardContent></Card>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <Card key={category} className="card-warm">
            <CardHeader><CardTitle className="text-[13px] font-medium uppercase tracking-[0.1em]">{category}</CardTitle></CardHeader>
            <CardContent>
              {items.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <span className="text-sm font-medium">{s.key}</span>
                    {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                  </div>
                  <span className="text-sm font-mono">{JSON.stringify(s.value)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
