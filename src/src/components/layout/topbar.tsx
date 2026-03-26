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
import { Search, Bell, Menu, LogOut, UserCog } from "lucide-react";
import Link from "next/link";

interface TopbarProps {
  onSearchOpen?: () => void;
  onSidebarToggle?: () => void;
}

export function Topbar({ onSearchOpen, onSidebarToggle }: TopbarProps) {
  const { user } = useAuth();

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`;

  return (
    <header className="h-14 border-b border-border/60 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={onSidebarToggle}
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors duration-200"
          aria-label="Toggle menu"
        >
          <Menu size={18} className="text-muted-foreground" />
        </button>

        {/* Search trigger */}
        <button
          onClick={onSearchOpen}
          className="hidden sm:flex items-center gap-2.5 h-9 px-3.5 rounded-lg border border-border/60 bg-muted/40 text-sm text-muted-foreground hover:bg-muted/70 hover:border-border transition-all duration-200 group"
        >
          <Search size={14} className="text-muted-foreground/70 group-hover:text-muted-foreground transition-colors" />
          <span className="text-[13px]">Search orders, customers...</span>
          <kbd className="hidden lg:inline-flex h-5 items-center rounded-md border border-border/60 bg-background/80 px-1.5 text-[10px] font-mono text-muted-foreground/60 ml-4">
            Ctrl+K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Notification bell */}
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 relative rounded-lg hover:bg-muted/70 transition-colors duration-200"
          aria-label="Notifications"
        >
          <Bell size={17} className="text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive ring-2 ring-background" />
        </Button>

        {/* Divider */}
        <div className="w-px h-6 bg-border/50 mx-1.5 hidden sm:block" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2.5 h-9 px-2 rounded-lg hover:bg-muted/70 transition-colors duration-200 outline-none"
          >
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/12 text-primary text-[11px] font-semibold font-[family-name:var(--font-heading)]">
              {initials}
            </span>
            <span className="hidden sm:block text-[13px] font-medium text-foreground/80">
              {user?.firstName}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 p-1.5">
            <DropdownMenuLabel className="px-2 py-1.5">
              <div className="text-[13px] font-semibold font-[family-name:var(--font-heading)]">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="px-2 py-1.5 rounded-md cursor-pointer">
              <Link href="/settings/preferences" className="flex items-center gap-2 w-full">
                <UserCog size={14} />
                <span className="text-[13px]">Preferences</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-2 py-1.5 rounded-md cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut size={14} />
              <span className="text-[13px]">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
