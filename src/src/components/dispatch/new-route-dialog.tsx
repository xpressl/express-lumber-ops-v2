"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Truck } from "lucide-react";

interface TruckOption {
  id: string;
  number: string;
  type: string;
  status: string;
}

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface OrderOption {
  id: string;
  orderNumber: string;
  customer: { companyName: string };
  totalWeight: number | null;
}

interface NewRouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  orders: OrderOption[];
}

/**
 * Dialog for creating a new dispatch route.
 * Fetches trucks from /api/dispatch/trucks and drivers from /api/users.
 * Submits to POST /api/dispatch/routes with date, truckId, driverId, orderIds, routeNotes.
 */
export function NewRouteDialog({ open, onOpenChange, onSuccess, orders }: NewRouteDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [trucks, setTrucks] = React.useState<TruckOption[]>([]);
  const [drivers, setDrivers] = React.useState<UserOption[]>([]);
  const [loadingOptions, setLoadingOptions] = React.useState(false);

  const [truckId, setTruckId] = React.useState("");
  const [driverId, setDriverId] = React.useState("");
  const [routeDate, setRouteDate] = React.useState("");
  const [routeNotes, setRouteNotes] = React.useState("");
  const [selectedOrderIds, setSelectedOrderIds] = React.useState<string[]>([]);

  const resetForm = React.useCallback(() => {
    setTruckId("");
    setDriverId("");
    setRouteDate("");
    setRouteNotes("");
    setSelectedOrderIds([]);
  }, []);

  /* Fetch trucks and drivers when dialog opens */
  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoadingOptions(true);

    Promise.all([
      fetch("/api/dispatch/trucks").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/users?limit=100").then((r) => (r.ok ? r.json().then((j: { data?: UserOption[] }) => j.data ?? []) : [])),
    ])
      .then(([truckData, userData]) => {
        if (cancelled) return;
        setTrucks(truckData);
        setDrivers(userData);
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false);
      });

    return () => { cancelled = true; };
  }, [open]);

  function toggleOrder(orderId: string) {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  }

  const canSubmit = truckId && driverId && routeDate && selectedOrderIds.length > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      toast.error("Truck, driver, date, and at least one order are required");
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        date: new Date(routeDate).toISOString(),
        truckId,
        driverId,
        orderIds: selectedOrderIds,
        ...(routeNotes ? { routeNotes } : {}),
      };

      const res = await fetch("/api/dispatch/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? `Failed to create route (${res.status})`);
      }

      toast.success("Route created");
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create route");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!submitting) { onOpenChange(v); if (!v) resetForm(); } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Route</DialogTitle>
          <DialogDescription>Create a dispatch route and assign orders</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Truck & Driver row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Truck *</Label>
              <select
                value={truckId}
                onChange={(e) => setTruckId(e.target.value)}
                disabled={loadingOptions}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
              >
                <option value="">Select truck...</option>
                {trucks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.number} ({t.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>Driver *</Label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                disabled={loadingOptions}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
              >
                <option value="">Select driver...</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.firstName} {d.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Route Date */}
          <div className="grid gap-1.5">
            <Label>Route Date *</Label>
            <Input type="date" required value={routeDate} onChange={(e) => setRouteDate(e.target.value)} />
          </div>

          {/* Order selection */}
          <div className="grid gap-1.5">
            <Label>
              Orders *
              <span className="text-muted-foreground text-xs font-normal ml-2">
                {selectedOrderIds.length} selected
              </span>
            </Label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border/50 bg-muted/10 divide-y divide-border/30">
              {orders.length === 0 ? (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground/50">
                  No dispatchable orders
                </div>
              ) : (
                orders.map((o) => (
                  <label
                    key={o.id}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <Checkbox
                      checked={selectedOrderIds.includes(o.id)}
                      onCheckedChange={() => toggleOrder(o.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-xs font-semibold">{o.orderNumber}</span>
                      <span className="text-xs text-muted-foreground ml-2 truncate">
                        {o.customer.companyName}
                      </span>
                    </div>
                    {o.totalWeight && (
                      <span className="font-mono text-[11px] text-muted-foreground tabular-nums flex items-center gap-1">
                        <Truck size={11} />
                        {Number(o.totalWeight).toLocaleString()} lbs
                      </span>
                    )}
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="grid gap-1.5">
            <Label>Notes</Label>
            <Textarea
              placeholder="Route notes..."
              rows={2}
              maxLength={1000}
              value={routeNotes}
              onChange={(e) => setRouteNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit} className="gap-2">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Create Route
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
