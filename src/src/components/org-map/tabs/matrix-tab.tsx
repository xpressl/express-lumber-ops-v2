"use client";

import * as React from "react";
import { RaciMatrix } from "@/components/org-map/raci-matrix";
import { LoadingState } from "@/components/shared/states";

interface MatrixData {
  tasks: {
    id: string;
    name: string;
    category: string;
    isCritical: boolean;
    assignments: {
      id: string;
      assignmentType: string;
      roleTemplate: { id: string; title: string } | null;
      user: { id: string; firstName: string; lastName: string } | null;
    }[];
  }[];
  roles: {
    id: string;
    title: string;
  }[];
}

export function MatrixTab() {
  const [data, setData] = React.useState<MatrixData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filterCategory, setFilterCategory] = React.useState("");

  const fetchMatrix = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.set("category", filterCategory);
      const res = await fetch(`/api/org-map/matrix?${params}`);
      if (!res.ok) { setError("Failed to load matrix data"); return; }
      setData(await res.json());
    } catch {
      setError("Failed to load matrix data");
    } finally {
      setIsLoading(false);
    }
  }, [filterCategory]);

  React.useEffect(() => { void fetchMatrix(); }, [fetchMatrix]);

  const categories = React.useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.tasks.map((t) => t.category))).sort();
  }, [data]);

  if (isLoading) return <LoadingState rows={8} />;
  if (error) return <p className="text-sm text-destructive px-4 py-8 text-center">{error}</p>;

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="h-8 rounded-md border border-border/50 bg-card px-2 text-xs font-mono focus:ring-1 focus:ring-primary/30"
        >
          <option value="">All Departments</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {data && (
          <span className="text-[10px] font-mono text-muted-foreground">
            {data.tasks.length} tasks × {data.roles.length} roles
          </span>
        )}
      </div>

      {data && <RaciMatrix tasks={data.tasks} roles={data.roles} />}
    </div>
  );
}
