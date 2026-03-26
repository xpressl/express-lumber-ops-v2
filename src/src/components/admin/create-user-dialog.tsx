"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateUserDialog({ open, onOpenChange, onCreated }: CreateUserDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      email: formData.get("email"),
      password: formData.get("password"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      phone: formData.get("phone") || undefined,
      title: formData.get("title") || undefined,
      department: formData.get("department") || undefined,
    };

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Failed to create user");
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
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="firstName" className="text-xs font-mono uppercase">First Name</Label>
              <Input id="firstName" name="firstName" required className="h-9" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName" className="text-xs font-mono uppercase">Last Name</Label>
              <Input id="lastName" name="lastName" required className="h-9" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs font-mono uppercase">Email</Label>
            <Input id="email" name="email" type="email" required className="h-9 font-mono" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password" className="text-xs font-mono uppercase">Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} className="h-9" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="title" className="text-xs font-mono uppercase">Title</Label>
              <Input id="title" name="title" className="h-9" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="department" className="text-xs font-mono uppercase">Department</Label>
              <Input id="department" name="department" className="h-9" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="phone" className="text-xs font-mono uppercase">Phone</Label>
            <Input id="phone" name="phone" className="h-9" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
