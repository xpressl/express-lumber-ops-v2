"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";

interface MobileNavItem {
  label: string;
  href: string;
  icon: string;
  permission?: string;
}

const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { label: "Home", href: "/command-center", icon: "H" },
  { label: "Orders", href: "/orders", icon: "O", permission: "orders.view" },
  { label: "Dispatch", href: "/dispatch", icon: "D", permission: "dispatch.view_board" },
  { label: "Yard", href: "/yard", icon: "Y", permission: "yard.view_tasks" },
  { label: "More", href: "/more", icon: "+" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { can } = usePermissions();

  const visibleItems = MOBILE_NAV_ITEMS.filter((item) => !item.permission || can(item.permission));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-center justify-around h-14">
        {visibleItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 min-w-0",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "inline-flex items-center justify-center w-6 h-6 rounded text-xs font-mono font-bold",
                  isActive && "bg-primary/10",
                )}
              >
                {item.icon}
              </span>
              <span className="text-[10px] truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
