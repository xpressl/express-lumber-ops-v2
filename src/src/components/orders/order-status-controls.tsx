"use client";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import type { OrderStatus } from "@prisma/client";

// Subset of transitions shown as action buttons
const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  APPROVED: "Approve",
  READY: "Mark Ready",
  LOADING: "Start Loading",
  LOADED: "Mark Loaded",
  DISPATCHED: "Dispatch",
  DELIVERED: "Mark Delivered",
  CLOSED: "Close Order",
  CANCELLED: "Cancel",
  RESCHEDULED: "Reschedule",
};

interface OrderStatusControlsProps {
  currentStatus: string;
  nextStates: string[];
  onTransition: (toStatus: string) => void;
  isLoading?: boolean;
}

export function OrderStatusControls({ currentStatus, nextStates, onTransition, isLoading }: OrderStatusControlsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <StatusBadge status={currentStatus} />
      {nextStates.length > 0 && <span className="text-muted-foreground text-xs">→</span>}
      {nextStates.map((status) => {
        const label = ACTION_LABELS[status as OrderStatus] ?? status.replace(/_/g, " ");
        const isDestructive = status === "CANCELLED" || status === "REFUSED";
        return (
          <Button
            key={status}
            variant={isDestructive ? "destructive" : "outline"}
            size="sm"
            onClick={() => onTransition(status)}
            disabled={isLoading}
            className="text-xs font-mono uppercase"
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
