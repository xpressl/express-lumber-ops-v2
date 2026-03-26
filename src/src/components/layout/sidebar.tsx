"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  permission?: string;
  section: string;
}

const NAV_ITEMS: NavItem[] = [
  // Operations
  { label: "Command Center", href: "/command-center", icon: "CC", section: "Operations", permission: "orders.view" },
  { label: "Orders", href: "/orders", icon: "OR", section: "Operations", permission: "orders.view" },
  { label: "Dispatch", href: "/dispatch", icon: "DI", section: "Operations", permission: "dispatch.view_board" },
  { label: "Pickup", href: "/pickup", icon: "PU", section: "Operations", permission: "orders.view" },
  // Delivery & Yard
  { label: "Delivery", href: "/delivery", icon: "DL", section: "Field", permission: "delivery.view_routes" },
  { label: "Yard", href: "/yard", icon: "YD", section: "Field", permission: "yard.view_tasks" },
  { label: "Receiving", href: "/receiving", icon: "RC", section: "Field", permission: "receiving.view" },
  // Finance
  { label: "Collections", href: "/collections", icon: "CL", section: "Finance", permission: "collections.view_aging" },
  { label: "Pricing", href: "/pricing", icon: "PR", section: "Finance", permission: "pricing.view_catalogue" },
  { label: "Purchasing", href: "/purchasing", icon: "PO", section: "Finance", permission: "purchasing.view" },
  // Sales
  { label: "Customers", href: "/customers", icon: "CU", section: "Sales", permission: "customers.view" },
  { label: "CRM", href: "/crm", icon: "CR", section: "Sales", permission: "crm.view_leads" },
  // System
  { label: "Imports", href: "/imports", icon: "IM", section: "System", permission: "imports.view_history" },
  { label: "Reports", href: "/reports", icon: "RP", section: "System", permission: "admin.export_reports" },
  { label: "Exceptions", href: "/exceptions", icon: "EX", section: "System" },
  { label: "Admin", href: "/admin", icon: "AD", section: "System", permission: "admin.manage_users" },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function AppSidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { can } = usePermissions();

  const visibleItems = NAV_ITEMS.filter((item) => !item.permission || can(item.permission));

  const sections = Array.from(new Set(visibleItems.map((i) => i.section)));

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200",
        collapsed ? "w-16" : "w-56",
        "hidden md:flex",
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border shrink-0">
        <button onClick={onToggle} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-sidebar-primary/10 border border-sidebar-primary/20">
            <span className="text-sm font-bold text-sidebar-primary font-mono">EL</span>
          </span>
          {!collapsed && (
            <span className="text-sm font-semibold text-sidebar-foreground truncate">Express Lumber</span>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
        {sections.map((section) => (
          <div key={section}>
            {!collapsed && (
              <p className="px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-sidebar-foreground/40">
                {section}
              </p>
            )}
            <div className="space-y-0.5">
              {visibleItems
                .filter((i) => i.section === section)
                .map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary font-medium"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                        collapsed && "justify-center px-0",
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-7 h-7 rounded text-[10px] font-mono font-bold shrink-0",
                          isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-sidebar-accent/50",
                        )}
                      >
                        {item.icon}
                      </span>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
