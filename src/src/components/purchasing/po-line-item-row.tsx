"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ChevronsUpDown, Loader2, Trash2 } from "lucide-react";

export interface POLine {
  productId: string;
  productLabel: string;
  quantity: string;
  unitCost: string;
  notes: string;
}

export interface ProductOption {
  id: string;
  sku: string;
  name: string;
}

interface LineItemRowProps {
  line: POLine;
  products: ProductOption[];
  loadingProducts: boolean;
  productSearch: string;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onProductSearch: (v: string) => void;
  onUpdate: (patch: Partial<POLine>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

/**
 * A single line-item row for the New PO form.
 * Contains a product picker, quantity, unit cost, and remove button.
 */
export function LineItemRow({
  line, products, loadingProducts, productSearch, isActive,
  onActivate, onDeactivate, onProductSearch, onUpdate, onRemove, canRemove,
}: LineItemRowProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  return (
    <div className="grid grid-cols-[1fr_5rem_5rem_2rem] gap-2 items-start">
      {/* Product picker */}
      <Popover
        open={popoverOpen}
        onOpenChange={(v) => {
          setPopoverOpen(v);
          if (v) onActivate();
          else onDeactivate();
        }}
      >
        <PopoverTrigger
          render={<Button variant="outline" className="w-full justify-between font-normal h-8 text-xs truncate" />}
        >
          {line.productLabel || <span className="text-muted-foreground">Product...</span>}
          <ChevronsUpDown className="ml-auto size-3 opacity-50 shrink-0" />
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search products..."
              value={isActive ? productSearch : ""}
              onValueChange={onProductSearch}
            />
            <CommandList>
              {loadingProducts && (
                <div className="flex justify-center py-4">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              )}
              <CommandEmpty>No products found</CommandEmpty>
              <CommandGroup>
                {products.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={p.id}
                    data-checked={p.id === line.productId || undefined}
                    onSelect={() => {
                      onUpdate({ productId: p.id, productLabel: `${p.sku} - ${p.name}` });
                      setPopoverOpen(false);
                      onDeactivate();
                    }}
                  >
                    <span className="font-mono text-xs">{p.sku}</span>
                    <span className="text-muted-foreground text-xs truncate ml-1">{p.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Quantity */}
      <Input
        type="number"
        step="0.01"
        min="0.01"
        placeholder="Qty"
        className="h-8 text-xs"
        value={line.quantity}
        onChange={(e) => onUpdate({ quantity: e.target.value })}
      />

      {/* Unit cost */}
      <Input
        type="number"
        step="0.01"
        min="0"
        placeholder="Cost"
        className="h-8 text-xs"
        value={line.unitCost}
        onChange={(e) => onUpdate({ unitCost: e.target.value })}
      />

      {/* Remove */}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        disabled={!canRemove}
        onClick={onRemove}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
}
