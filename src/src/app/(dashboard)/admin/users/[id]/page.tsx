"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timeline, type TimelineEvent } from "@/components/shared/timeline";
import { LoadingState } from "@/components/shared/states";

interface UserDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  lastLoginAt: string | null;
  profile: { title: string | null; department: string | null; timezone: string } | null;
  roleAssignments: Array<{
    id: string;
    role: { name: string; displayName: string };
    location: { name: string } | null;
    assignedAt: string;
  }>;
}

export default function UserDetailPage() {
  const params = useParams();
  const userId = params["id"] as string;
  const [user, setUser] = React.useState<UserDetail | null>(null);
  const [auditEvents, setAuditEvents] = React.useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [userRes, auditRes] = await Promise.all([
          fetch(`/api/users/${userId}`),
          fetch(`/api/audit?entityType=User&entityId=${userId}&limit=20`),
        ]);
        if (userRes.ok) setUser(await userRes.json());
        if (auditRes.ok) {
          const json = await auditRes.json();
          setAuditEvents(
            (json.data ?? []).map((e: Record<string, unknown>) => ({
              id: e["id"] as string,
              action: e["action"] as string,
              actorName: e["actorName"] as string,
              timestamp: e["timestamp"] as string,
              before: e["before"] as Record<string, unknown> | undefined,
              after: e["after"] as Record<string, unknown> | undefined,
            })),
          );
        }
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [userId]);

  if (isLoading) return <LoadingState rows={5} />;
  if (!user) return <div className="text-muted-foreground">User not found</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        description={user.email}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Users", href: "/admin/users" },
          { label: `${user.firstName} ${user.lastName}` },
        ]}
        actions={<StatusBadge status={user.status} />}
      />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Name" value={`${user.firstName} ${user.lastName}`} />
              <DetailRow label="Email" value={user.email} />
              <DetailRow label="Phone" value={user.phone ?? "—"} />
              <DetailRow label="Title" value={user.profile?.title ?? "—"} />
              <DetailRow label="Department" value={user.profile?.department ?? "—"} />
              <DetailRow label="Timezone" value={user.profile?.timezone ?? "—"} />
              <DetailRow label="Last Login" value={user.lastLoginAt ?? "Never"} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Role Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {user.roleAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No roles assigned</p>
              ) : (
                <div className="space-y-2">
                  {user.roleAssignments.map((ra) => (
                    <div key={ra.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <span className="text-sm font-medium">{ra.role.displayName}</span>
                        <span className="text-xs text-muted-foreground font-mono ml-2">({ra.role.name})</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {ra.location?.name ?? "All locations"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit History</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline events={auditEvents} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-mono">{value}</span>
    </div>
  );
}
