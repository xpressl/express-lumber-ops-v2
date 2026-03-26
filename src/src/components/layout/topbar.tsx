"use client";

import { signOut } from "next-auth/react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopbarProps {
  onSearchOpen?: () => void;
  onSidebarToggle?: () => void;
}

export function Topbar({ onSearchOpen, onSidebarToggle }: TopbarProps) {
  const { user } = useAuth();

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={onSidebarToggle}
          className="md:hidden inline-flex items-center justify-center w-8 h-8 rounded hover:bg-muted transition-colors"
        >
          <span className="text-sm font-mono">=</span>
        </button>

        {/* Search trigger */}
        <button
          onClick={onSearchOpen}
          className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-md border border-border bg-muted/50 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <span className="text-xs">Search...</span>
          <kbd className="hidden md:inline-flex h-5 items-center rounded border border-border bg-background px-1.5 text-[10px] font-mono text-muted-foreground">
            Ctrl+K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification bell placeholder */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
          <span className="text-sm">B</span>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button className="flex items-center gap-2 h-8 px-2 rounded-md hover:bg-muted transition-colors">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
              <span className="hidden sm:block text-sm text-foreground">
                {user?.firstName} {user?.lastName}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="text-sm font-medium">{user?.firstName} {user?.lastName}</div>
              <div className="text-xs text-muted-foreground font-mono">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span>Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <span className="text-destructive">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
