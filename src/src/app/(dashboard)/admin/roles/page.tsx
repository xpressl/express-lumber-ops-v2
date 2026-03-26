"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { CreateRoleDialog } from "@/components/admin/create-role-dialog";

interface RoleRow {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  department: string | null;
  isSystem: boolean;
  _count: { permissions: number; userAssignments: number };
}

const columns: DataTableColumn<RoleRow>[] = [
  {
    id: "displayName",
    header: "Role",
    cell: (row) => (
      <div>
        <span className="font-medium">{row.displayName}</span>
        <span className="text-[10px] font-mono text-muted-foreground ml-2">({row.name})</span>
      </div>
    ),
    sortable: true,
  },
  { id: "department", header: "Department", accessorFn: (row) => row.department ?? "—" },
  {
    id: "permissions",
    header: "Perms",
    accessorFn: (row) => row._count.permissions,
    className: "text-center font-mono",
  },
  {
    id: "users",
    header: "Users",
    accessorFn: (row) => row._count.userAssignments,
    className: "text-center font-mono",
  },
  {
    id: "system",
    header: "Type",
    cell: (row) => (
      <span className={`text-[10px] font-mono uppercase ${row.isSystem ? "text-warning" : "text-muted-foreground"}`}>
        {row.isSystem ? "System" : "Custom"}
      </span>
    ),
  },
];

export default function AdminRolesPage() {
  const router = useRouter();
  const [data, setData] = React.useState<RoleRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);

  const fetchRoles = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/roles");
      if (res.ok) setData(await res.json());
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => { void fetchRoles(); }, [fetchRoles]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role Management"
        description="Manage roles and permission templates"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Roles" }]}
        actions={
          <Button onClick={() => setShowCreate(true)} className="font-mono uppercase tracking-wider text-xs">
            + New Role
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        total={data.length}
        isLoading={isLoading}
        emptyMessage="No roles found"
        rowKey={(row) => row.id}
        onRowClick={(row) => router.push(`/admin/roles/${row.id}`)}
      />

      <CreateRoleDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={() => void fetchRoles()}
      />
    </div>
  );
}
