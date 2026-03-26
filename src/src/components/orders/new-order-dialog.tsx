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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown, Loader2 } from "lucide-react";

interface CustomerOption {
  id: string;
  companyName: string;
}

interface NewOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  locationId: string;
}

const ORDER_TYPES = [
  { value: "DELIVERY", label: "Delivery" },
  { value: "PICKUP", label: "Pickup" },
  { value: "WILL_CALL", label: "Will Call" },
  { value: "TRANSFER", label: "Transfer" },
] as const;

/**
 * Dialog form for creating a new order.
 * Fetches customers via /api/customers with search, submits to POST /api/orders.
 */
export function NewOrderDialog({ open, onOpenChange, onSuccess, locationId }: NewOrderDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [customerOpen, setCustomerOpen] = React.useState(false);
  const [customers, setCustomers] = React.useState<CustomerOption[]>([]);
  const [customerSearch, setCustomerSearch] = React.useState("");
  const [loadingCustomers, setLoadingCustomers] = React.useState(false);

  const [customerId, setCustomerId] = React.useState("");
  const [customerLabel, setCustomerLabel] = React.useState("");
  const [type, setType] = React.useState("DELIVERY");
  const [requestedDate, setRequestedDate] = React.useState("");
  const [street, setStreet] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [zip, setZip] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetForm = React.useCallback(() => {
    setCustomerId("");
    setCustomerLabel("");
    setType("DELIVERY");
    setRequestedDate("");
    setStreet("");
    setCity("");
    setState("");
    setZip("");
    setNotes("");
  }, []);

  /* Debounced customer search */
  React.useEffect(() => {
    if (!customerOpen) return;

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      setLoadingCustomers(true);
      try {
        const params = new URLSearchParams({ limit: "20" });
        if (customerSearch) params.set("search", customerSearch);
        const res = await fetch(`/api/customers?${params}`);
        if (res.ok) {
          const json = await res.json();
          setCustomers(json.data.map((c: { id: string; companyName: string }) => ({
            id: c.id,
            companyName: c.companyName,
          })));
        }
      } finally {
        setLoadingCustomers(false);
      }
    }, 300);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [customerSearch, customerOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !requestedDate) {
      toast.error("Customer and delivery date are required");
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        type,
        customerId,
        requestedDate: new Date(requestedDate).toISOString(),
        locationId,
      };

      if (street && city && state && zip) {
        body.deliveryAddress = { street, city, state, zip };
      }
      if (notes) body.specialInstructions = notes;

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? `Failed to create order (${res.status})`);
      }

      toast.success("Order created");
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!submitting) { onOpenChange(v); if (!v) resetForm(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Order</DialogTitle>
          <DialogDescription>Create a new sales order</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Customer search */}
          <div className="grid gap-1.5">
            <Label>Customer *</Label>
            <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
              <PopoverTrigger
                render={<Button variant="outline" className="w-full justify-between font-normal h-8 text-sm" />}
              >
                {customerLabel || <span className="text-muted-foreground">Select customer...</span>}
                <ChevronsUpDown className="ml-auto size-4 opacity-50" />
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search customers..."
                    value={customerSearch}
                    onValueChange={setCustomerSearch}
                  />
                  <CommandList>
                    {loadingCustomers && (
                      <div className="flex justify-center py-4">
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    <CommandEmpty>No customers found</CommandEmpty>
                    <CommandGroup>
                      {customers.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.id}
                          data-checked={c.id === customerId || undefined}
                          onSelect={() => {
                            setCustomerId(c.id);
                            setCustomerLabel(c.companyName);
                            setCustomerOpen(false);
                          }}
                        >
                          {c.companyName}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Type & Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Delivery Date *</Label>
              <Input type="date" required value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)} />
            </div>
          </div>

          {/* Address fields */}
          <fieldset className="grid gap-2">
            <Label className="text-muted-foreground text-xs">Delivery Address</Label>
            <Input placeholder="Street" value={street} onChange={(e) => setStreet(e.target.value)} />
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
              <Input placeholder="ST" maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} />
              <Input placeholder="ZIP" maxLength={10} value={zip} onChange={(e) => setZip(e.target.value)} />
            </div>
          </fieldset>

          {/* Notes */}
          <div className="grid gap-1.5">
            <Label>Notes</Label>
            <Textarea placeholder="Special instructions..." rows={2} maxLength={1000}
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting || !customerId || !requestedDate} className="gap-2">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Create Order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
