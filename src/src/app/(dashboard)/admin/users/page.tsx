"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";

interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  roles: string[];
  createdAt: string;
}

const columns: DataTableColumn<UserRow>[] = [
  {
    id: "name",
    header: "Name",
    cell: (row) => (
      <span className="font-medium">{row.firstName} {row.lastName}</span>
    ),
    sortable: true,
  },
  {
    id: "email",
    header: "Email",
    cell: (row) => <span className="font-mono text-xs">{row.email}</span>,
    sortable: true,
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} size="sm" />,
    sortable: true,
  },
  {
    id: "roles",
    header: "Roles",
    cell: (row) => (
      <div className="flex flex-wrap gap-1">
        {row.roles.map((r) => (
          <span key={r} className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">
            {r}
          </span>
        ))}
      </div>
    ),
  },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const [data, setData] = React.useState<UserRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);

  const fetchUsers = React.useCallback(async (p = 1, search?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/users?${params}`);
      if (res.ok) {
        const json = await res.json();
        setData(
          json.data.map((u: Record<string, unknown>) => ({
            id: u["id"],
            firstName: u["firstName"],
            lastName: u["lastName"],
            email: u["email"],
            status: u["status"],
            roles: ((u["roleAssignments"] as Array<{ role: { name: string } }>) ?? []).map(
              (ra) => ra.role.name,
            ),
            createdAt: u["createdAt"],
          })),
        );
        setTotal(json.total);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="User Management"
        description="Manage user accounts, roles, and access"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Users" },
        ]}
        actions={
          <Button onClick={() => setShowCreate(true)} className="rounded-lg gap-2 font-medium text-[13px] h-9 px-4">
            <Plus size={15} />New User
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        totalPages={Math.ceil(total / 20)}
        onPageChange={(p) => {
          setPage(p);
          void fetchUsers(p);
        }}
        onSearch={(q) => void fetchUsers(1, q)}
        searchPlaceholder="Search users..."
        isLoading={isLoading}
        emptyMessage="No users found"
        rowKey={(row) => row.id}
        onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
      />

      <CreateUserDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={() => void fetchUsers()}
      />
    </div>
  );
}
