"use client";

import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateRoleDialog({ open, onOpenChange, onCreated }: CreateRoleDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      name: (fd.get("name") as string).toUpperCase().replace(/\s+/g, "_"),
      displayName: fd.get("displayName"),
      description: fd.get("description") || undefined,
      department: fd.get("department") || undefined,
    };

    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Failed to create role");
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Create Role</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="displayName" className="text-xs font-mono uppercase">Display Name</Label>
            <Input id="displayName" name="displayName" required className="h-9" placeholder="Branch Manager" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="name" className="text-xs font-mono uppercase">System Name</Label>
            <Input id="name" name="name" required className="h-9 font-mono" placeholder="BRANCH_MANAGER" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="department" className="text-xs font-mono uppercase">Department</Label>
            <Input id="department" name="department" className="h-9" placeholder="Operations" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description" className="text-xs font-mono uppercase">Description</Label>
            <Textarea id="description" name="description" className="h-20 text-sm" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Creating..." : "Create Role"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
