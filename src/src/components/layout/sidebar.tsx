"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import {
  LayoutDashboard,
  ClipboardList,
  Truck,
  Package,
  MapPin,
  Warehouse,
  PackageCheck,
  DollarSign,
  Tag,
  ShoppingCart,
  Users,
  UserPlus,
  Upload,
  BarChart3,
  AlertTriangle,
  Settings,
  ChevronLeft,
  ChevronRight,
  TreePine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
  section: string;
}

const NAV_ITEMS: NavItem[] = [
  // Operations
  { label: "Command Center", href: "/command-center", icon: LayoutDashboard, section: "Operations", permission: "orders.view" },
  { label: "Orders", href: "/orders", icon: ClipboardList, section: "Operations", permission: "orders.view" },
  { label: "Dispatch", href: "/dispatch", icon: Truck, section: "Operations", permission: "dispatch.view_board" },
  { label: "Pickup", href: "/pickup", icon: Package, section: "Operations", permission: "orders.view" },
  // Field
  { label: "Delivery", href: "/delivery", icon: MapPin, section: "Field", permission: "delivery.view_routes" },
  { label: "Yard", href: "/yard", icon: Warehouse, section: "Field", permission: "yard.view_tasks" },
  { label: "Receiving", href: "/receiving", icon: PackageCheck, section: "Field", permission: "receiving.view" },
  // Finance
  { label: "Collections", href: "/collections", icon: DollarSign, section: "Finance", permission: "collections.view_aging" },
  { label: "Pricing", href: "/pricing", icon: Tag, section: "Finance", permission: "pricing.view_catalogue" },
  { label: "Purchasing", href: "/purchasing", icon: ShoppingCart, section: "Finance", permission: "purchasing.view" },
  // Sales
  { label: "Customers", href: "/customers", icon: Users, section: "Sales", permission: "customers.view" },
  { label: "CRM", href: "/crm", icon: UserPlus, section: "Sales", permission: "crm.view_leads" },
  // System
  { label: "Imports", href: "/imports", icon: Upload, section: "System", permission: "imports.view_history" },
  { label: "Reports", href: "/reports", icon: BarChart3, section: "System", permission: "admin.export_reports" },
  { label: "Exceptions", href: "/exceptions", icon: AlertTriangle, section: "System" },
  { label: "Admin", href: "/admin", icon: Settings, section: "System", permission: "admin.manage_users" },
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
        "fixed left-0 top-0 z-40 h-screen bg-sidebar flex flex-col transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed ? "w-[68px]" : "w-60",
        "hidden md:flex",
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 shrink-0">
        <Link href="/command-center" className="flex items-center gap-3 group">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-sidebar-primary/15 border border-sidebar-primary/25 group-hover:bg-sidebar-primary/25 transition-colors duration-200">
            <TreePine className="w-4.5 h-4.5 text-sidebar-primary" />
          </span>
          {!collapsed && (
            <div className="animate-fade-in">
              <span className="text-[13px] font-semibold text-sidebar-foreground tracking-tight font-[family-name:var(--font-heading)]">
                Express Lumber
              </span>
              <span className="block text-[10px] text-sidebar-foreground/40 font-mono tracking-wider uppercase">
                Operations
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-3 h-px bg-sidebar-border/60" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-5">
        {sections.map((section) => (
          <div key={section}>
            {!collapsed && (
              <div className="flex items-center gap-2 px-2.5 mb-2">
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-sidebar-foreground/35">
                  {section}
                </p>
                <div className="flex-1 h-px bg-sidebar-border/30" />
              </div>
            )}
            {collapsed && (
              <div className="mx-auto w-6 h-px bg-sidebar-border/30 mb-2" />
            )}
            <div className="space-y-0.5">
              {visibleItems
                .filter((i) => i.section === section)
                .map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] transition-all duration-200",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary font-medium"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground/90",
                        collapsed && "justify-center px-2",
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-primary animate-scale-in" />
                      )}
                      <Icon
                        className={cn(
                          "shrink-0 transition-colors duration-200",
                          isActive ? "text-sidebar-primary" : "",
                        )}
                        size={collapsed ? 20 : 18}
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="shrink-0 p-2.5 border-t border-sidebar-border/40">
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-2 w-full rounded-lg px-2.5 py-2 text-[12px] text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent/40 transition-all duration-200",
            collapsed && "justify-center px-2",
          )}
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span className="font-mono tracking-wider uppercase">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
