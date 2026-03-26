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
import { ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { LineItemRow, type POLine, type ProductOption } from "./po-line-item-row";

interface VendorOption {
  id: string;
  name: string;
}

interface NewPODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  locationId?: string;
}

const EMPTY_LINE: POLine = {
  productId: "",
  productLabel: "",
  quantity: "",
  unitCost: "",
  notes: "",
};

/**
 * Dialog for creating a new Purchase Order.
 * Fetches vendors and products for selection, submits to POST /api/purchasing/pos.
 */
export function NewPODialog({ open, onOpenChange, onSuccess, locationId }: NewPODialogProps) {
  const [submitting, setSubmitting] = React.useState(false);

  /* Vendor picker state */
  const [vendorOpen, setVendorOpen] = React.useState(false);
  const [vendors, setVendors] = React.useState<VendorOption[]>([]);
  const [vendorSearch, setVendorSearch] = React.useState("");
  const [loadingVendors, setLoadingVendors] = React.useState(false);
  const [vendorId, setVendorId] = React.useState("");
  const [vendorLabel, setVendorLabel] = React.useState("");

  /* Product picker state (shared across lines) */
  const [products, setProducts] = React.useState<ProductOption[]>([]);
  const [productSearch, setProductSearch] = React.useState("");
  const [loadingProducts, setLoadingProducts] = React.useState(false);
  const [activeLineIdx, setActiveLineIdx] = React.useState<number | null>(null);

  /* Form fields */
  const [expectedDate, setExpectedDate] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [lines, setLines] = React.useState<POLine[]>([{ ...EMPTY_LINE }]);

  const vendorTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const productTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetForm = React.useCallback(() => {
    setVendorId("");
    setVendorLabel("");
    setExpectedDate("");
    setNotes("");
    setLines([{ ...EMPTY_LINE }]);
  }, []);

  /* Debounced vendor search */
  React.useEffect(() => {
    if (!vendorOpen) return;
    if (vendorTimerRef.current) clearTimeout(vendorTimerRef.current);
    vendorTimerRef.current = setTimeout(async () => {
      setLoadingVendors(true);
      try {
        const params = new URLSearchParams({ limit: "20", status: "ACTIVE" });
        if (vendorSearch) params.set("search", vendorSearch);
        const res = await fetch(`/api/purchasing/vendors?${params}`);
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : json.data ?? [];
          setVendors(list.map((v: { id: string; name: string }) => ({ id: v.id, name: v.name })));
        }
      } finally {
        setLoadingVendors(false);
      }
    }, 300);
    return () => { if (vendorTimerRef.current) clearTimeout(vendorTimerRef.current); };
  }, [vendorSearch, vendorOpen]);

  /* Debounced product search */
  React.useEffect(() => {
    if (activeLineIdx === null) return;
    if (productTimerRef.current) clearTimeout(productTimerRef.current);
    productTimerRef.current = setTimeout(async () => {
      setLoadingProducts(true);
      try {
        const params = new URLSearchParams({ limit: "20" });
        if (productSearch) params.set("search", productSearch);
        const res = await fetch(`/api/products?${params}`);
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : json.data ?? [];
          setProducts(list.map((p: { id: string; sku: string; name: string }) => ({
            id: p.id, sku: p.sku, name: p.name,
          })));
        }
      } finally {
        setLoadingProducts(false);
      }
    }, 300);
    return () => { if (productTimerRef.current) clearTimeout(productTimerRef.current); };
  }, [productSearch, activeLineIdx]);

  function updateLine(idx: number, patch: Partial<POLine>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validLines = lines.filter((l) => l.productId && Number(l.quantity) > 0);
    if (!vendorId) { toast.error("Vendor is required"); return; }
    if (validLines.length === 0) { toast.error("At least one line item is required"); return; }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        vendorId,
        locationId: locationId ?? undefined,
        lines: validLines.map((l) => ({
          productId: l.productId,
          quantity: Number(l.quantity),
          unitCost: Number(l.unitCost) || 0,
          notes: l.notes || undefined,
        })),
      };
      if (expectedDate) body.expectedDate = new Date(expectedDate).toISOString();
      if (notes) body.notes = notes;

      const res = await fetch("/api/purchasing/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? `Failed to create PO (${res.status})`);
      }

      toast.success("Purchase order created");
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create PO");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!submitting) { onOpenChange(v); if (!v) resetForm(); } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Purchase Order</DialogTitle>
          <DialogDescription>Create a PO to send to a vendor</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Vendor picker */}
          <div className="grid gap-1.5">
            <Label>Vendor *</Label>
            <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
              <PopoverTrigger
                render={<Button variant="outline" className="w-full justify-between font-normal h-8 text-sm" />}
              >
                {vendorLabel || <span className="text-muted-foreground">Select vendor...</span>}
                <ChevronsUpDown className="ml-auto size-4 opacity-50" />
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput placeholder="Search vendors..." value={vendorSearch} onValueChange={setVendorSearch} />
                  <CommandList>
                    {loadingVendors && (
                      <div className="flex justify-center py-4">
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    <CommandEmpty>No vendors found</CommandEmpty>
                    <CommandGroup>
                      {vendors.map((v) => (
                        <CommandItem
                          key={v.id}
                          value={v.id}
                          data-checked={v.id === vendorId || undefined}
                          onSelect={() => { setVendorId(v.id); setVendorLabel(v.name); setVendorOpen(false); }}
                        >
                          {v.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Expected date */}
          <div className="grid gap-1.5">
            <Label>Expected Delivery Date</Label>
            <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
          </div>

          {/* Line items */}
          <fieldset className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Line Items *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => setLines((prev) => [...prev, { ...EMPTY_LINE }])}
              >
                <Plus size={12} /> Add Line
              </Button>
            </div>

            {lines.map((line, idx) => (
              <LineItemRow
                key={idx}
                line={line}
                products={products}
                loadingProducts={loadingProducts}
                productSearch={productSearch}
                isActive={activeLineIdx === idx}
                onActivate={() => setActiveLineIdx(idx)}
                onDeactivate={() => setActiveLineIdx(null)}
                onProductSearch={setProductSearch}
                onUpdate={(patch) => updateLine(idx, patch)}
                onRemove={() => removeLine(idx)}
                canRemove={lines.length > 1}
              />
            ))}
          </fieldset>

          {/* Notes */}
          <div className="grid gap-1.5">
            <Label>Notes</Label>
            <Textarea placeholder="PO notes..." rows={2} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting || !vendorId || !lines.some((l) => l.productId)} className="gap-2">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Create PO
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
