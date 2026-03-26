"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingState } from "@/components/shared/states";

interface RoleDetail {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  permissions: Array<{
    id: string;
    permissionId: string;
    scopeType: string;
    permission: { code: string; name: string; module: string; action: string };
  }>;
  userAssignments: Array<{
    id: string;
    user: { firstName: string; lastName: string; email: string };
  }>;
}

interface PermissionItem {
  id: string;
  code: string;
  name: string;
  module: string;
  action: string;
}

export default function RoleDetailPage() {
  const params = useParams();
  const roleId = params["id"] as string;
  const [role, setRole] = React.useState<RoleDetail | null>(null);
  const [allPermissions, setAllPermissions] = React.useState<PermissionItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [roleRes, permsRes] = await Promise.all([
          fetch(`/api/roles/${roleId}`),
          fetch("/api/roles"), // We'd ideally have a /api/permissions route
        ]);
        if (roleRes.ok) setRole(await roleRes.json());
        // For now, permissions come from role detail
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [roleId]);

  if (isLoading) return <LoadingState rows={5} />;
  if (!role) return <div className="text-muted-foreground">Role not found</div>;

  const assignedPermCodes = new Set(role.permissions.map((rp) => rp.permission.code));

  // Group permissions by module
  const groupedPerms: Record<string, typeof role.permissions> = {};
  for (const rp of role.permissions) {
    const mod = rp.permission.module;
    if (!groupedPerms[mod]) groupedPerms[mod] = [];
    groupedPerms[mod]!.push(rp);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={role.displayName}
        description={role.description ?? `${role.name} role`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Roles", href: "/admin/roles" },
          { label: role.displayName },
        ]}
      />

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Assigned Permissions ({role.permissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(groupedPerms).map(([module, perms]) => (
            <div key={module} className="mb-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                {module}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {perms.map((rp) => (
                  <div key={rp.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/50">
                    <Checkbox checked disabled />
                    <span className="text-sm">{rp.permission.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                      {rp.scopeType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {role.permissions.length === 0 && (
            <p className="text-sm text-muted-foreground">No permissions assigned</p>
          )}
        </CardContent>
      </Card>

      {/* Assigned Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Users with this Role ({role.userAssignments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {role.userAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users assigned</p>
          ) : (
            <div className="space-y-1">
              {role.userAssignments.map((ua) => (
                <div key={ua.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-sm">
                    {ua.user.firstName} {ua.user.lastName}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">{ua.user.email}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
