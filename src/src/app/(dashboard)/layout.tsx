"use client";

import * as React from "react";
import { AppSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchCommand } from "@/components/shared/search-command";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - desktop only */}
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Main content area */}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-200",
          sidebarCollapsed ? "md:ml-16" : "md:ml-56",
        )}
      >
        <Topbar
          onSearchOpen={() => setSearchOpen(true)}
          onSidebarToggle={() => setSidebarCollapsed((prev) => !prev)}
        />

        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Command palette */}
      {searchOpen && (
        <SearchCommand
          onSelect={() => setSearchOpen(false)}
        />
      )}
    </div>
  );
}
