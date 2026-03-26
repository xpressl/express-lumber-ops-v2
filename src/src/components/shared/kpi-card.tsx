"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  previousValue?: number;
  format?: "number" | "currency" | "percent";
  trend?: "up" | "down" | "flat";
  trendLabel?: string;
  icon?: LucideIcon;
  className?: string;
  onClick?: () => void;
  accent?: "default" | "copper" | "success" | "warning" | "destructive";
}

export function KPICard({
  title,
  value,
  trend,
  trendLabel,
  icon: Icon,
  className,
  onClick,
  accent = "default",
}: KPICardProps) {
  return (
    <Card
      className={cn(
        "card-warm group relative overflow-hidden transition-all duration-300",
        onClick && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        className,
      )}
      onClick={onClick}
    >
      {/* Top accent bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-[2px]",
          accent === "default" && "bg-primary/30",
          accent === "copper" && "bg-copper/40",
          accent === "success" && "bg-success/40",
          accent === "warning" && "bg-warning/40",
          accent === "destructive" && "bg-destructive/40",
        )}
      />

      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">
              {title}
            </p>
            <p className="text-3xl font-light tracking-tight font-[family-name:var(--font-heading)]">
              {value}
            </p>
          </div>
          {Icon && (
            <div className={cn(
              "p-2 rounded-lg transition-colors duration-200",
              accent === "default" && "bg-primary/8 text-primary/60 group-hover:bg-primary/12",
              accent === "copper" && "bg-copper/8 text-copper/60 group-hover:bg-copper/12",
              accent === "success" && "bg-success/8 text-success/60 group-hover:bg-success/12",
              accent === "warning" && "bg-warning/8 text-warning/60 group-hover:bg-warning/12",
              accent === "destructive" && "bg-destructive/8 text-destructive/60 group-hover:bg-destructive/12",
            )}>
              <Icon size={18} strokeWidth={1.5} />
            </div>
          )}
        </div>

        {(trend || trendLabel) && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/40">
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold",
                  trend === "up" && "bg-success/10 text-success",
                  trend === "down" && "bg-destructive/10 text-destructive",
                  trend === "flat" && "bg-muted text-muted-foreground",
                )}
              >
                {trend === "up" ? "↑" : trend === "down" ? "↓" : "~"}
              </span>
            )}
            {trendLabel && (
              <span className="text-[12px] text-muted-foreground">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
