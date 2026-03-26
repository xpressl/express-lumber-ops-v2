import Link from "next/link";
import {
  Users,
  Shield,
  Lock,
  ToggleLeft,
  CheckSquare,
  FileText,
  ShieldAlert,
  Sliders,
  Wrench,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface AdminLink {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

const ADMIN_LINKS: AdminLink[] = [
  { title: "Users", description: "Manage user accounts and access", href: "/admin/users", icon: Users },
  { title: "Roles", description: "Configure roles and permission templates", href: "/admin/roles", icon: Shield },
  { title: "Permissions", description: "Fine-grained permission management", href: "/admin/permissions", icon: Lock },
  { title: "Feature Flags", description: "Control feature rollout", href: "/admin/feature-flags", icon: ToggleLeft },
  { title: "Approvals", description: "Review pending approvals", href: "/admin/approvals", icon: CheckSquare },
  { title: "Audit Log", description: "Complete action history", href: "/admin/audit-log", icon: FileText },
  { title: "Security", description: "Login activity and access events", href: "/admin/security", icon: ShieldAlert },
  { title: "Settings", description: "Branch-specific configuration", href: "/admin/settings", icon: Sliders },
  { title: "Configuration", description: "System-wide settings", href: "/admin/configuration", icon: Wrench },
  { title: "Access Simulator", description: "Test permission combinations", href: "/admin/access-simulator", icon: Eye },
];

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Administration"
        description="System configuration, user management, and security"
        breadcrumbs={[{ label: "Administration" }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ADMIN_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className="group">
              <Card className="card-warm hover:shadow-md transition-all duration-200 h-full">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors duration-200">
                    <Icon size={18} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold font-[family-name:var(--font-heading)]">
                      {link.title}
                    </h3>
                    <p className="text-[12px] text-muted-foreground/70 leading-relaxed">
                      {link.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
