"use client";

import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";

export interface TimelineEvent {
  id: string;
  action: string;
  actorName: string;
  entityName?: string;
  timestamp: string | Date;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
  maxItems?: number;
}

/** Action to human-readable description */
function describeAction(action: string): string {
  const parts = action.split(".");
  if (parts.length === 2) {
    const verb = parts[1]!
      .replace(/_/g, " ")
      .replace("created", "created")
      .replace("updated", "updated")
      .replace("status changed", "changed status")
      .replace("deleted", "deleted");
    return verb.charAt(0).toUpperCase() + verb.slice(1);
  }
  return action;
}

/** Action to icon indicator color */
function actionColor(action: string): string {
  if (action.includes("created")) return "bg-success";
  if (action.includes("deleted") || action.includes("cancelled")) return "bg-destructive";
  if (action.includes("approved") || action.includes("resolved")) return "bg-success";
  if (action.includes("denied") || action.includes("failed") || action.includes("refused")) return "bg-destructive";
  if (action.includes("escalated") || action.includes("hold")) return "bg-warning";
  return "bg-primary";
}

export function Timeline({ events, className, maxItems = 50 }: TimelineProps) {
  const displayEvents = events.slice(0, maxItems);

  if (displayEvents.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground py-8 text-center", className)}>
        No events yet
      </div>
    );
  }

  return (
    <div className={cn("relative space-y-0", className)}>
      {/* Vertical line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

      {displayEvents.map((event) => {
        const ts = typeof event.timestamp === "string" ? new Date(event.timestamp) : event.timestamp;

        return (
          <div key={event.id} className="relative flex gap-3 pb-4 group">
            {/* Dot indicator */}
            <div className={cn("relative z-10 mt-1.5 size-[15px] rounded-full border-2 border-background shrink-0", actionColor(event.action))} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">
                  {describeAction(event.action)}
                </span>
                <span className="text-xs text-muted-foreground">
                  by {event.actorName}
                </span>
              </div>

              {/* Timestamp */}
              <time
                className="text-xs text-muted-foreground/70 font-mono"
                title={format(ts, "PPpp")}
              >
                {formatDistanceToNow(ts, { addSuffix: true })}
              </time>

              {/* Change details (collapsed by default) */}
              {event.before && event.after && (
                <details className="mt-1">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    View changes
                  </summary>
                  <div className="mt-1 text-xs font-mono bg-muted/50 rounded p-2 space-y-0.5">
                    {Object.keys(event.after).map((key) => {
                      const oldVal = event.before?.[key];
                      const newVal = event.after?.[key];
                      if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return null;
                      return (
                        <div key={key}>
                          <span className="text-muted-foreground">{key}:</span>{" "}
                          <span className="text-destructive line-through">{String(oldVal ?? "—")}</span>{" "}
                          <span className="text-success">{String(newVal)}</span>
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
