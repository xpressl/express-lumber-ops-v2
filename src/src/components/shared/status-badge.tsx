"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Color mapping for common statuses across the platform */
const STATUS_STYLES: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  // Order statuses
  DRAFT: { variant: "outline", className: "border-muted-foreground/20 text-muted-foreground bg-muted/30" },
  IMPORTED: { variant: "outline", className: "border-info/30 text-info bg-info/8" },
  NEEDS_REVIEW: { variant: "default", className: "bg-warning/15 text-warning border border-warning/20" },
  APPROVED: { variant: "default", className: "bg-success/15 text-success border border-success/20" },
  ON_CREDIT_HOLD: { variant: "destructive", className: "bg-destructive/15 text-destructive border border-destructive/20" },
  WAITING_INVENTORY: { variant: "secondary", className: "bg-muted/50 text-muted-foreground" },
  PARTIALLY_READY: { variant: "default", className: "bg-warning/12 text-warning border border-warning/15" },
  READY: { variant: "default", className: "bg-success/15 text-success border border-success/20" },
  LOADING: { variant: "default", className: "bg-info/15 text-info border border-info/20" },
  LOADED: { variant: "default", className: "bg-info/15 text-info border border-info/20" },
  DISPATCHED: { variant: "default", className: "bg-primary/15 text-primary border border-primary/20" },
  OUT_FOR_DELIVERY: { variant: "default", className: "bg-primary/15 text-primary border border-primary/20" },
  DELIVERED: { variant: "default", className: "bg-success/15 text-success border border-success/20" },
  PICKUP_READY: { variant: "default", className: "bg-success/15 text-success border border-success/20" },
  PICKED_UP: { variant: "default", className: "bg-success/15 text-success border border-success/20" },
  REFUSED: { variant: "destructive", className: "bg-destructive/15 text-destructive border border-destructive/20" },
  RESCHEDULED: { variant: "default", className: "bg-warning/15 text-warning border border-warning/20" },
  CANCELLED: { variant: "outline", className: "border-destructive/25 text-destructive/80 bg-destructive/5" },
  CLOSED: { variant: "secondary", className: "bg-muted/40 text-muted-foreground" },
  IN_PROGRESS: { variant: "default", className: "bg-info/15 text-info border border-info/20" },

  // User statuses
  ACTIVE: { variant: "default", className: "bg-success/15 text-success border border-success/20" },
  INACTIVE: { variant: "secondary", className: "bg-muted/40 text-muted-foreground" },
  SUSPENDED: { variant: "destructive", className: "bg-destructive/15 text-destructive border border-destructive/20" },
  PENDING: { variant: "default", className: "bg-warning/15 text-warning border border-warning/20" },

  // Exception statuses
  OPEN: { variant: "destructive", className: "bg-destructive/15 text-destructive border border-destructive/20" },
  ACKNOWLEDGED: { variant: "default", className: "bg-warning/15 text-warning border border-warning/20" },
  RESOLVED: { variant: "default", className: "bg-success/15 text-success border border-success/20" },
  ESCALATED: { variant: "destructive", className: "bg-destructive/20 text-destructive border border-destructive/30 animate-pulse" },
  DISMISSED: { variant: "secondary", className: "bg-muted/40 text-muted-foreground" },

  // Severity
  CRITICAL: { variant: "destructive", className: "bg-destructive text-white font-semibold" },
  HIGH: { variant: "destructive", className: "bg-destructive/15 text-destructive border border-destructive/20" },
  MEDIUM: { variant: "default", className: "bg-warning/15 text-warning border border-warning/20" },
  LOW: { variant: "secondary", className: "bg-muted/40 text-muted-foreground" },

  // Feature flags
  ON: { variant: "default", className: "bg-success/15 text-success border border-success/20" },
  OFF: { variant: "secondary", className: "bg-muted/40 text-muted-foreground" },
  BETA: { variant: "default", className: "bg-info/15 text-info border border-info/20" },
  READ_ONLY: { variant: "outline", className: "border-muted-foreground/20 text-muted-foreground bg-muted/20" },
  HIDDEN: { variant: "secondary", className: "opacity-50 bg-muted/30 text-muted-foreground" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function StatusBadge({ status, className, size = "default" }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? { variant: "outline" as const };
  const label = status.replace(/_/g, " ");

  return (
    <Badge
      variant={style.variant}
      className={cn(
        "font-medium tracking-wide rounded-md",
        size === "sm" && "px-1.5 py-0 text-[9px]",
        size === "default" && "px-2 py-0.5 text-[10px]",
        size === "lg" && "px-2.5 py-1 text-[11px]",
        style.className,
        className,
      )}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-70 mr-1.5" />
      {label}
    </Badge>
  );
}
