"use client";

import * as React from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CreateCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const CUSTOMER_TYPES = ["COMMERCIAL", "RESIDENTIAL", "CONTRACTOR", "GOVERNMENT"] as const;

/**
 * Dialog for creating a new customer. Submits to POST /api/customers
 * and calls onCreated on success so the parent can refresh its list.
 */
export function CreateCustomerDialog({ open, onOpenChange, onCreated }: CreateCustomerDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  function resetState() {
    setError(null);
    setFieldErrors({});
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    resetState();
    setIsLoading(true);

    const fd = new FormData(e.currentTarget);
    const str = (key: string) => (fd.get(key) as string)?.trim() || undefined;

    const body = {
      accountNumber: str("accountNumber"),
      companyName: str("companyName"),
      type: str("type") || "COMMERCIAL",
      creditLimit: str("creditLimit") ? Number(str("creditLimit")) : undefined,
      paymentTerms: str("paymentTerms"),
      locationId: str("locationId"),
      dba: str("dba"),
      notes: str("notes"),
      billingAddress: buildAddress(fd, "billing"),
      shippingAddress: buildAddress(fd, "shipping"),
    };

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json();
        if (json.details && Array.isArray(json.details)) {
          const errs: Record<string, string> = {};
          for (const d of json.details) {
            const key = Array.isArray(d.path) ? d.path.join(".") : String(d.path ?? "");
            errs[key] = d.message;
          }
          setFieldErrors(errs);
        }
        setError(json.error ?? "Failed to create customer");
        return;
      }

      onOpenChange(false);
      onCreated();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { resetState(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Customer</DialogTitle>
          <DialogDescription>Add a new customer account to the system.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {/* Core fields */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Account #" name="accountNumber" required maxLength={20} error={fieldErrors["accountNumber"]} />
            <Field label="Location ID" name="locationId" required error={fieldErrors["locationId"]} />
          </div>

          <Field label="Company Name" name="companyName" required maxLength={200} error={fieldErrors["companyName"]} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="type" className="text-xs font-mono uppercase">Type</Label>
              <select
                id="type"
                name="type"
                defaultValue="COMMERCIAL"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {CUSTOMER_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            <Field label="DBA" name="dba" maxLength={200} error={fieldErrors["dba"]} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Credit Limit" name="creditLimit" type="number" min={0} error={fieldErrors["creditLimit"]} />
            <Field label="Payment Terms" name="paymentTerms" placeholder="Net 30" error={fieldErrors["paymentTerms"]} />
          </div>

          {/* Billing Address */}
          <AddressFields prefix="billing" label="Billing Address" errors={fieldErrors} />

          {/* Shipping Address */}
          <AddressFields prefix="shipping" label="Shipping Address" errors={fieldErrors} />

          <div className="space-y-1">
            <Label htmlFor="notes" className="text-xs font-mono uppercase">Notes</Label>
            <Textarea id="notes" name="notes" maxLength={2000} rows={2} placeholder="Optional notes..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { resetState(); onOpenChange(false); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Reusable labeled input field */
function Field({
  label, name, error, ...inputProps
}: { label: string; name: string; error?: string } & React.ComponentProps<"input">) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name} className="text-xs font-mono uppercase">{label}</Label>
      <Input id={name} name={name} className="h-9" aria-invalid={!!error} {...inputProps} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/** Collapsible address field group */
function AddressFields({
  prefix,
  label,
  errors,
}: {
  prefix: string;
  label: string;
  errors: Record<string, string>;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const errKey = (f: string) => `${prefix === "billing" ? "billingAddress" : "shippingAddress"}.${f}`;

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        + Add {label}
      </button>
    );
  }

  return (
    <fieldset className="space-y-2 rounded-lg border border-border/50 p-3">
      <legend className="text-xs font-mono uppercase text-muted-foreground px-1">{label}</legend>
      <Field label="Street" name={`${prefix}Street`} required error={errors[errKey("street")]} />
      <div className="grid grid-cols-3 gap-2">
        <Field label="City" name={`${prefix}City`} required error={errors[errKey("city")]} />
        <Field label="State" name={`${prefix}State`} required maxLength={2} placeholder="TX" error={errors[errKey("state")]} />
        <Field label="ZIP" name={`${prefix}Zip`} required minLength={5} error={errors[errKey("zip")]} />
      </div>
    </fieldset>
  );
}

/** Build an address object from form data, or undefined if street is empty */
function buildAddress(fd: FormData, prefix: string) {
  const street = (fd.get(`${prefix}Street`) as string)?.trim();
  if (!street) return undefined;
  return {
    street,
    city: (fd.get(`${prefix}City`) as string)?.trim() || "",
    state: (fd.get(`${prefix}State`) as string)?.trim() || "",
    zip: (fd.get(`${prefix}Zip`) as string)?.trim() || "",
  };
}
