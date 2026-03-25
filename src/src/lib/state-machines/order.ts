import type { OrderStatus } from "@prisma/client";

/** Valid state transitions for orders */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ["IMPORTED", "NEEDS_REVIEW", "APPROVED", "CANCELLED"],
  IMPORTED: ["NEEDS_REVIEW", "APPROVED", "CANCELLED"],
  NEEDS_REVIEW: ["APPROVED", "ON_CREDIT_HOLD", "CANCELLED"],
  APPROVED: ["ON_CREDIT_HOLD", "WAITING_INVENTORY", "PARTIALLY_READY", "READY", "CANCELLED"],
  ON_CREDIT_HOLD: ["APPROVED"],
  WAITING_INVENTORY: ["PARTIALLY_READY", "READY", "CANCELLED", "RESCHEDULED"],
  PARTIALLY_READY: ["READY", "WAITING_INVENTORY", "CANCELLED", "RESCHEDULED"],
  READY: ["LOADING", "PICKUP_READY", "CANCELLED", "RESCHEDULED"],
  LOADING: ["LOADED", "READY"],
  LOADED: ["DISPATCHED"],
  DISPATCHED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED", "REFUSED", "RESCHEDULED"],
  DELIVERED: ["CLOSED"],
  PICKUP_READY: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["CLOSED"],
  REFUSED: ["RESCHEDULED", "CANCELLED", "CLOSED"],
  RESCHEDULED: ["APPROVED"],
  CANCELLED: [],
  CLOSED: [],
};

/** Terminal states that cannot transition further */
export const TERMINAL_STATES: OrderStatus[] = ["CANCELLED", "CLOSED"];

/** States that require specific guards before entering */
export const GUARDED_TRANSITIONS: Partial<Record<OrderStatus, string>> = {
  ON_CREDIT_HOLD: "Credit check must fail",
  APPROVED: "Credit check must pass (or hold released)",
  READY: "All line items must have READY status",
  LOADING: "Must be assigned to a truck and route",
  DISPATCHED: "Dispatch checklist must be completed",
  DELIVERED: "POD must be captured",
  CLOSED: "All financials must be reconciled",
};

/** Side effects triggered by entering a state */
export const TRANSITION_SIDE_EFFECTS: Partial<Record<OrderStatus, string[]>> = {
  ON_CREDIT_HOLD: ["exception.create:HOLD_WITH_URGENT_ORDER", "notification:dispatcher", "notification:collections"],
  READY: ["notification:dispatcher", "socket:dispatch_board"],
  DISPATCHED: ["notification:driver", "socket:dispatch_board", "audit:order.dispatched"],
  OUT_FOR_DELIVERY: ["gps:start_tracking", "notification:customer_sms"],
  DELIVERED: ["audit:order.delivered", "socket:dispatch_board"],
  REFUSED: ["exception.create:DELIVERY_FAILURE", "notification:dispatcher", "yard:create_return_task"],
  CANCELLED: ["inventory:restore_reservations", "audit:order.cancelled", "notification:stakeholders"],
};

/** Check if a transition is valid */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  const allowed = TRANSITIONS[from];
  return allowed !== undefined && allowed.includes(to);
}

/** Get all valid next states from current state */
export function getNextStates(current: OrderStatus): OrderStatus[] {
  return TRANSITIONS[current] ?? [];
}

/** Check if a state is terminal */
export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATES.includes(status);
}

/** Validate a transition and return error if invalid */
export function validateTransition(
  from: OrderStatus,
  to: OrderStatus,
): { valid: boolean; error?: string } {
  if (isTerminal(from)) {
    return { valid: false, error: `Cannot transition from terminal state: ${from}` };
  }

  if (!canTransition(from, to)) {
    const allowed = getNextStates(from);
    return {
      valid: false,
      error: `Invalid transition: ${from} -> ${to}. Allowed: ${allowed.join(", ") || "none"}`,
    };
  }

  return { valid: true };
}

/** Get guard description for a target state */
export function getGuard(targetState: OrderStatus): string | undefined {
  return GUARDED_TRANSITIONS[targetState];
}

/** Get side effects for entering a state */
export function getSideEffects(targetState: OrderStatus): string[] {
  return TRANSITION_SIDE_EFFECTS[targetState] ?? [];
}

/** Compute readiness percent from line item statuses */
export function computeReadinessPercent(
  items: { readyStatus: string }[],
): number {
  if (items.length === 0) return 0;
  const readyCount = items.filter((i) => i.readyStatus === "READY" || i.readyStatus === "SUBSTITUTED").length;
  return Math.round((readyCount / items.length) * 100);
}
