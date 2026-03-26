"use client";

import { cn } from "@/lib/utils";

interface CapacityBarProps {
  label: string;
  used: number;
  max: number;
  unit?: string;
  className?: string;
}

export function CapacityBar({ label, used, max, unit = "", className }: CapacityBarProps) {
  const percent = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const isOverloaded = percent > 100;
  const isWarning = percent > 85;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-muted-foreground uppercase">{label}</span>
        <span className={cn(
          isOverloaded ? "text-destructive font-bold" : isWarning ? "text-warning" : "text-foreground",
        )}>
          {used.toLocaleString()}{unit} / {max.toLocaleString()}{unit} ({percent}%)
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isOverloaded ? "bg-destructive" : isWarning ? "bg-warning" : "bg-primary",
          )}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
