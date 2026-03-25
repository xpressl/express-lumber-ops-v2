"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Color mapping for common statuses across the platform */
const STATUS_STYLES: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  // Order statuses
  DRAFT: { variant: "outline", className: "border-muted-foreground/30 text-muted-foreground" },
  IMPORTED: { variant: "outline", className: "border-info text-info" },
  NEEDS_REVIEW: { variant: "default", className: "bg-warning text-warning-foreground" },
  APPROVED: { variant: "default", className: "bg-success text-success-foreground" },
  ON_CREDIT_HOLD: { variant: "destructive" },
  WAITING_INVENTORY: { variant: "secondary" },
  PARTIALLY_READY: { variant: "default", className: "bg-warning/80 text-warning-foreground" },
  READY: { variant: "default", className: "bg-success text-success-foreground" },
  LOADING: { variant: "default", className: "bg-info text-info-foreground" },
  LOADED: { variant: "default", className: "bg-info text-info-foreground" },
  DISPATCHED: { variant: "default", className: "bg-primary text-primary-foreground" },
  OUT_FOR_DELIVERY: { variant: "default", className: "bg-primary text-primary-foreground" },
  DELIVERED: { variant: "default", className: "bg-success text-success-foreground" },
  PICKUP_READY: { variant: "default", className: "bg-success text-success-foreground" },
  PICKED_UP: { variant: "default", className: "bg-success text-success-foreground" },
  REFUSED: { variant: "destructive" },
  RESCHEDULED: { variant: "default", className: "bg-warning text-warning-foreground" },
  CANCELLED: { variant: "outline", className: "border-destructive text-destructive" },
  CLOSED: { variant: "secondary" },
  IN_PROGRESS: { variant: "default", className: "bg-info text-info-foreground" },

  // User statuses
  ACTIVE: { variant: "default", className: "bg-success text-success-foreground" },
  INACTIVE: { variant: "secondary" },
  SUSPENDED: { variant: "destructive" },
  PENDING: { variant: "default", className: "bg-warning text-warning-foreground" },

  // Exception statuses
  OPEN: { variant: "destructive" },
  ACKNOWLEDGED: { variant: "default", className: "bg-warning text-warning-foreground" },
  RESOLVED: { variant: "default", className: "bg-success text-success-foreground" },
  ESCALATED: { variant: "destructive", className: "bg-destructive text-white animate-pulse" },
  DISMISSED: { variant: "secondary" },

  // Severity
  CRITICAL: { variant: "destructive", className: "bg-destructive text-white" },
  HIGH: { variant: "destructive" },
  MEDIUM: { variant: "default", className: "bg-warning text-warning-foreground" },
  LOW: { variant: "secondary" },

  // Feature flags
  ON: { variant: "default", className: "bg-success text-success-foreground" },
  OFF: { variant: "secondary" },
  BETA: { variant: "default", className: "bg-info text-info-foreground" },
  READ_ONLY: { variant: "outline" },
  HIDDEN: { variant: "secondary", className: "opacity-50" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "default";
}

export function StatusBadge({ status, className, size = "default" }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? { variant: "outline" as const };
  const label = status.replace(/_/g, " ");

  return (
    <Badge
      variant={style.variant}
      className={cn(
        "font-mono text-[10px] uppercase tracking-wider",
        size === "sm" && "px-1.5 py-0 text-[9px]",
        style.className,
        className,
      )}
    >
      {label}
    </Badge>
  );
}
