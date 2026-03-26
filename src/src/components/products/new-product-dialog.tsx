"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";

interface NewProductDialogProps {
  onCreated: () => void;
}

const UOM_OPTIONS = ["EA", "LF", "BF", "SF", "PC", "BDL", "TON", "CY"];
const STATUS_OPTIONS = ["ACTIVE", "DISCONTINUED", "SPECIAL_ORDER"] as const;

const INITIAL_FORM = {
  sku: "",
  name: "",
  uom: "EA",
  currentCost: "",
  currentSell: "",
  status: "ACTIVE" as string,
  locationId: "default",
};

export function NewProductDialog({ onCreated }: NewProductDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState(INITIAL_FORM);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sku || !form.name || !form.currentCost || !form.currentSell) {
      setError("SKU, name, cost, and sell price are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: form.sku,
          name: form.name,
          uom: form.uom,
          currentCost: parseFloat(form.currentCost),
          currentSell: parseFloat(form.currentSell),
          status: form.status,
          locationId: form.locationId,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }

      setForm(INITIAL_FORM);
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) { setForm(INITIAL_FORM); setError(null); }
      }}
    >
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} className="mr-1" /> New Product
      </Button>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Product</DialogTitle>
          <DialogDescription>Add a product to the catalogue.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="np-sku">SKU *</Label>
              <Input id="np-sku" value={form.sku} onChange={(e) => updateField("sku", e.target.value)} placeholder="LBR-2X4-08" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="np-uom">Unit of Measure</Label>
              <select
                id="np-uom"
                value={form.uom}
                onChange={(e) => updateField("uom", e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                {UOM_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="np-name">Product Name *</Label>
            <Input id="np-name" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="2x4 Lumber 8ft" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="np-cost">Cost *</Label>
              <Input id="np-cost" type="number" step="0.01" min="0" value={form.currentCost} onChange={(e) => updateField("currentCost", e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="np-sell">Sell Price *</Label>
              <Input id="np-sell" type="number" step="0.01" min="0" value={form.currentSell} onChange={(e) => updateField("currentSell", e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="np-status">Status</Label>
            <select
              id="np-status"
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 size={14} className="mr-1 animate-spin" />}
              Create Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
