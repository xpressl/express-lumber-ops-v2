"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import {
  LayoutDashboard,
  ClipboardList,
  Truck,
  Warehouse,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

interface MobileNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
}

const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { label: "Home", href: "/command-center", icon: LayoutDashboard },
  { label: "Orders", href: "/orders", icon: ClipboardList, permission: "orders.view" },
  { label: "Dispatch", href: "/dispatch", icon: Truck, permission: "dispatch.view_board" },
  { label: "Yard", href: "/yard", icon: Warehouse, permission: "yard.view_tasks" },
  { label: "More", href: "/admin", icon: MoreHorizontal },
];

export function MobileNav() {
  const pathname = usePathname();
  const { can } = usePermissions();

  const visibleItems = MOBILE_NAV_ITEMS.filter(
    (item) => !item.permission || can(item.permission)
  );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-center justify-around h-16">
        {visibleItems.slice(0, 5).map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] py-1 transition-colors duration-200",
                isActive ? "text-primary" : "text-muted-foreground active:text-primary/70"
              )}
            >
              <span
                className={cn(
                  "inline-flex items-center justify-center w-10 h-8 rounded-full transition-all duration-200",
                  isActive
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "transition-all duration-200",
                    isActive ? "w-6 h-6" : "w-5 h-5"
                  )}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium leading-none transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Safe area spacer for devices with home indicator */}
      <div className="h-[env(safe-area-inset-bottom,0px)]" />
    </nav>
  );
}
