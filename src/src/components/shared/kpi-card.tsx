"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  previousValue?: number;
  format?: "number" | "currency" | "percent";
  trend?: "up" | "down" | "flat";
  trendLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function KPICard({
  title,
  value,
  trend,
  trendLabel,
  icon,
  className,
  onClick,
}: KPICardProps) {
  return (
    <Card
      className={cn(
        "transition-colors",
        onClick && "cursor-pointer hover:bg-muted/50",
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-semibold tracking-tight font-mono">{value}</p>
          </div>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>

        {(trend || trendLabel) && (
          <div className="flex items-center gap-1 mt-2">
            {trend && (
              <span
                className={cn(
                  "text-xs font-mono font-medium",
                  trend === "up" && "text-success",
                  trend === "down" && "text-destructive",
                  trend === "flat" && "text-muted-foreground",
                )}
              >
                {trend === "up" ? "+" : trend === "down" ? "-" : "~"}
              </span>
            )}
            {trendLabel && (
              <span className="text-xs text-muted-foreground">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
