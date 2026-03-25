import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Express Lumber Ops database...");

  // ============================================================
  // 1. LOCATIONS
  // ============================================================
  const mainYard = await prisma.location.upsert({
    where: { code: "MAIN" },
    update: {},
    create: {
      code: "MAIN",
      name: "Express Lumber - Main Yard",
      address: "1250 Industrial Blvd",
      city: "Newark",
      state: "NJ",
      zip: "07114",
      phone: "(973) 555-0100",
      email: "main@expresslumber.com",
      timezone: "America/New_York",
      cutoffTime: "14:00",
    },
  });

  const southBranch = await prisma.location.upsert({
    where: { code: "SOUTH" },
    update: {},
    create: {
      code: "SOUTH",
      name: "Express Lumber - South Branch",
      address: "890 Commerce Way",
      city: "Edison",
      state: "NJ",
      zip: "08817",
      phone: "(732) 555-0200",
      email: "south@expresslumber.com",
      timezone: "America/New_York",
      cutoffTime: "13:30",
    },
  });

  console.log(`Created locations: ${mainYard.name}, ${southBranch.name}`);

  // ============================================================
  // 2. ROLES
  // ============================================================
  const roles = [
    { name: "SUPER_ADMIN", displayName: "Super Admin", description: "Full system access", isSystem: true, department: "IT", sortOrder: 0 },
    { name: "OWNER", displayName: "Owner/Executive", description: "Company owner with full visibility", isSystem: true, department: "Executive", sortOrder: 1 },
    { name: "GENERAL_MANAGER", displayName: "General Manager", description: "Cross-branch operational oversight", isSystem: false, department: "Management", sortOrder: 2 },
    { name: "BRANCH_MANAGER", displayName: "Branch Manager", description: "Branch-scoped operational management", isSystem: false, department: "Management", sortOrder: 3 },
    { name: "DISPATCHER", displayName: "Dispatcher", description: "Manage dispatch board, assign trucks, create routes", isSystem: false, department: "Operations", sortOrder: 4 },
    { name: "YARD_MANAGER", displayName: "Yard Manager", description: "Manage yard tasks, bays, and loading", isSystem: false, department: "Yard", sortOrder: 5 },
    { name: "YARD_WORKER", displayName: "Yard Worker", description: "Execute yard tasks, prep orders, load trucks", isSystem: false, department: "Yard", sortOrder: 6 },
    { name: "DRIVER", displayName: "Driver", description: "Deliver orders, capture POD/COD, use driver PWA", isSystem: false, department: "Delivery", sortOrder: 7 },
    { name: "COUNTER_SALES", displayName: "Counter Sales", description: "Create orders, handle walk-in customers, pickups", isSystem: false, department: "Sales", sortOrder: 8 },
    { name: "OUTSIDE_SALES", displayName: "Outside Sales Rep", description: "Manage leads, estimates, customer relationships", isSystem: false, department: "Sales", sortOrder: 9 },
    { name: "COLLECTIONS_REP", displayName: "Collections Representative", description: "Manage AR aging, call log, promises, disputes", isSystem: false, department: "Finance", sortOrder: 10 },
    { name: "AR_MANAGER", displayName: "AR Manager", description: "Oversee collections, approve holds, manage team", isSystem: false, department: "Finance", sortOrder: 11 },
    { name: "CREDIT_MANAGER", displayName: "Credit Manager", description: "Credit decisions, write-offs, payment plans", isSystem: false, department: "Finance", sortOrder: 12 },
    { name: "PURCHASING", displayName: "Purchasing Agent", description: "Create POs, manage vendors, RFQs", isSystem: false, department: "Purchasing", sortOrder: 13 },
    { name: "RECEIVING_CLERK", displayName: "Receiving Clerk", description: "Receive POs, log discrepancies, vendor issues", isSystem: false, department: "Warehouse", sortOrder: 14 },
    { name: "AP_SUPPORT", displayName: "AP Support", description: "Three-way match review, payable processing", isSystem: false, department: "Finance", sortOrder: 15 },
    { name: "PRICING", displayName: "Pricing Analyst", description: "Manage pricing, cost changes, quote exposure", isSystem: false, department: "Pricing", sortOrder: 16 },
    { name: "CASHIER", displayName: "Cashier", description: "Process payments, verify COD, cash handling", isSystem: false, department: "Finance", sortOrder: 17 },
    { name: "VIEWER", displayName: "Read-Only Viewer", description: "View-only access for auditors and observers", isSystem: true, department: null, sortOrder: 99 },
  ];

  const createdRoles: Record<string, string> = {};
  for (const role of roles) {
    const r = await prisma.role.upsert({
      where: { name: role.name },
      update: { displayName: role.displayName, description: role.description },
      create: role,
    });
    createdRoles[role.name] = r.id;
  }
  console.log(`Created ${roles.length} roles`);

  // ============================================================
  // 3. PERMISSIONS
  // ============================================================
  const permissions = [
    // Orders
    { code: "orders.view", name: "View Orders", module: "orders", action: "VIEW" as const },
    { code: "orders.create", name: "Create Orders", module: "orders", action: "CREATE" as const },
    { code: "orders.edit", name: "Edit Orders", module: "orders", action: "EDIT" as const },
    { code: "orders.cancel", name: "Cancel Orders", module: "orders", action: "DELETE" as const },
    { code: "orders.override_status", name: "Override Order Status", module: "orders", action: "OVERRIDE" as const },
    { code: "orders.view_margin", name: "View Order Margins", module: "orders", action: "VIEW" as const },
    { code: "orders.view_cost", name: "View Order Costs", module: "orders", action: "VIEW" as const },
    // Dispatch
    { code: "dispatch.view_board", name: "View Dispatch Board", module: "dispatch", action: "VIEW" as const },
    { code: "dispatch.assign_truck", name: "Assign Truck", module: "dispatch", action: "EDIT" as const },
    { code: "dispatch.reorder_stops", name: "Reorder Stops", module: "dispatch", action: "EDIT" as const },
    { code: "dispatch.release_route", name: "Release Route", module: "dispatch", action: "APPROVE" as const },
    { code: "dispatch.override_capacity", name: "Override Truck Capacity", module: "dispatch", action: "OVERRIDE" as const },
    { code: "dispatch.view_driver_location", name: "View Driver Location", module: "dispatch", action: "VIEW" as const },
    // Delivery
    { code: "delivery.view_routes", name: "View Delivery Routes", module: "delivery", action: "VIEW" as const },
    { code: "delivery.capture_pod", name: "Capture POD", module: "delivery", action: "CREATE" as const },
    { code: "delivery.capture_cod", name: "Capture COD", module: "delivery", action: "CREATE" as const },
    { code: "delivery.view_cod_amounts", name: "View COD Amounts", module: "delivery", action: "VIEW" as const },
    { code: "delivery.mark_stop_complete", name: "Mark Stop Complete", module: "delivery", action: "EDIT" as const },
    { code: "delivery.escalate_issue", name: "Escalate Delivery Issue", module: "delivery", action: "CREATE" as const },
    // Yard
    { code: "yard.view_tasks", name: "View Yard Tasks", module: "yard", action: "VIEW" as const },
    { code: "yard.assign_tasks", name: "Assign Yard Tasks", module: "yard", action: "EDIT" as const },
    { code: "yard.complete_task", name: "Complete Yard Task", module: "yard", action: "EDIT" as const },
    { code: "yard.mark_ready", name: "Mark Order Ready", module: "yard", action: "EDIT" as const },
    { code: "yard.mark_loaded", name: "Mark Order Loaded", module: "yard", action: "EDIT" as const },
    { code: "yard.log_damage", name: "Log Damage", module: "yard", action: "CREATE" as const },
    { code: "yard.adjust_inventory", name: "Adjust Inventory", module: "yard", action: "EDIT" as const },
    { code: "yard.approve_cycle_count", name: "Approve Cycle Count", module: "yard", action: "APPROVE" as const },
    // Receiving
    { code: "receiving.view", name: "View Receiving", module: "receiving", action: "VIEW" as const },
    { code: "receiving.receive_po", name: "Receive PO", module: "receiving", action: "CREATE" as const },
    { code: "receiving.log_discrepancy", name: "Log Discrepancy", module: "receiving", action: "CREATE" as const },
    { code: "receiving.approve_receiving", name: "Approve Receiving", module: "receiving", action: "APPROVE" as const },
    { code: "receiving.create_vendor_issue", name: "Create Vendor Issue", module: "receiving", action: "CREATE" as const },
    // Collections
    { code: "collections.view_aging", name: "View AR Aging", module: "collections", action: "VIEW" as const },
    { code: "collections.assign_accounts", name: "Assign Collection Accounts", module: "collections", action: "EDIT" as const },
    { code: "collections.log_call", name: "Log Collection Call", module: "collections", action: "CREATE" as const },
    { code: "collections.create_promise", name: "Create Promise to Pay", module: "collections", action: "CREATE" as const },
    { code: "collections.create_dispute", name: "Create Dispute", module: "collections", action: "CREATE" as const },
    { code: "collections.edit_payment_plan", name: "Edit Payment Plan", module: "collections", action: "EDIT" as const },
    { code: "collections.approve_writeoff", name: "Approve Write-off", module: "collections", action: "APPROVE" as const },
    { code: "collections.recommend_hold", name: "Recommend Credit Hold", module: "collections", action: "CREATE" as const },
    { code: "collections.release_hold", name: "Release Credit Hold", module: "collections", action: "APPROVE" as const },
    // Customers
    { code: "customers.view", name: "View Customers", module: "customers", action: "VIEW" as const },
    { code: "customers.create", name: "Create Customers", module: "customers", action: "CREATE" as const },
    { code: "customers.edit", name: "Edit Customers", module: "customers", action: "EDIT" as const },
    { code: "customers.edit_credit", name: "Edit Credit Settings", module: "customers", action: "EDIT" as const },
    { code: "customers.view_balance", name: "View Customer Balance", module: "customers", action: "VIEW" as const },
    // Pricing
    { code: "pricing.view_catalogue", name: "View Price Catalogue", module: "pricing", action: "VIEW" as const },
    { code: "pricing.view_cost", name: "View Costs", module: "pricing", action: "VIEW" as const },
    { code: "pricing.edit_sell_price", name: "Edit Sell Price", module: "pricing", action: "EDIT" as const },
    { code: "pricing.approve_price_override", name: "Approve Price Override", module: "pricing", action: "APPROVE" as const },
    { code: "pricing.import_vendor_prices", name: "Import Vendor Prices", module: "pricing", action: "CREATE" as const },
    // Purchasing
    { code: "purchasing.view", name: "View Purchasing", module: "purchasing", action: "VIEW" as const },
    { code: "purchasing.create_po", name: "Create PO", module: "purchasing", action: "CREATE" as const },
    { code: "purchasing.approve_po", name: "Approve PO", module: "purchasing", action: "APPROVE" as const },
    { code: "purchasing.create_rfq", name: "Create RFQ", module: "purchasing", action: "CREATE" as const },
    { code: "purchasing.approve_ap_match", name: "Approve AP Match", module: "purchasing", action: "APPROVE" as const },
    // CRM
    { code: "crm.view_leads", name: "View Leads", module: "crm", action: "VIEW" as const },
    { code: "crm.create_estimate", name: "Create Estimate", module: "crm", action: "CREATE" as const },
    { code: "crm.edit_estimate", name: "Edit Estimate", module: "crm", action: "EDIT" as const },
    { code: "crm.view_dormant", name: "View Dormant Accounts", module: "crm", action: "VIEW" as const },
    // Imports
    { code: "imports.upload", name: "Upload Import", module: "imports", action: "CREATE" as const },
    { code: "imports.approve_batch", name: "Approve Import Batch", module: "imports", action: "APPROVE" as const },
    { code: "imports.view_history", name: "View Import History", module: "imports", action: "VIEW" as const },
    // Admin
    { code: "admin.manage_users", name: "Manage Users", module: "admin", action: "ADMIN" as const },
    { code: "admin.manage_roles", name: "Manage Roles", module: "admin", action: "ADMIN" as const },
    { code: "admin.manage_feature_flags", name: "Manage Feature Flags", module: "admin", action: "ADMIN" as const },
    { code: "admin.manage_settings", name: "Manage Settings", module: "admin", action: "ADMIN" as const },
    { code: "admin.view_audit_log", name: "View Audit Log", module: "admin", action: "VIEW" as const },
    { code: "admin.view_security_events", name: "View Security Events", module: "admin", action: "VIEW" as const },
    { code: "admin.export_reports", name: "Export Reports", module: "admin", action: "EXPORT" as const },
  ];

  const createdPermissions: Record<string, string> = {};
  for (const perm of permissions) {
    const p = await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name },
      create: { ...perm, isSystem: true },
    });
    createdPermissions[perm.code] = p.id;
  }
  console.log(`Created ${permissions.length} permissions`);

  // ============================================================
  // 4. ROLE-PERMISSION ASSIGNMENTS
  // ============================================================

  // Helper: assign permissions to a role
  async function assignPerms(roleName: string, permCodes: string[], scopeType: "ALL" | "BRANCH" | "OWN" | "TEAM" | "ASSIGNED" | "READ_ONLY" = "ALL") {
    const roleId = createdRoles[roleName];
    if (!roleId) return;
    for (const code of permCodes) {
      const permId = createdPermissions[code];
      if (!permId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId: permId } },
        update: { scopeType },
        create: { roleId, permissionId: permId, scopeType },
      });
    }
  }

  const allPermCodes = permissions.map((p) => p.code);

  // SUPER_ADMIN gets everything
  await assignPerms("SUPER_ADMIN", allPermCodes);

  // OWNER gets everything
  await assignPerms("OWNER", allPermCodes);

  // GENERAL_MANAGER gets everything except admin.manage_users, admin.manage_roles
  await assignPerms("GENERAL_MANAGER", allPermCodes.filter((c) => !c.startsWith("admin.manage_")));

  // BRANCH_MANAGER - scoped to branch
  await assignPerms("BRANCH_MANAGER", [
    "orders.view", "orders.create", "orders.edit", "orders.cancel", "orders.view_margin", "orders.view_cost",
    "dispatch.view_board", "dispatch.assign_truck", "dispatch.reorder_stops", "dispatch.release_route", "dispatch.view_driver_location",
    "delivery.view_routes", "delivery.view_cod_amounts",
    "yard.view_tasks", "yard.assign_tasks", "yard.approve_cycle_count",
    "receiving.view", "receiving.approve_receiving", "receiving.create_vendor_issue",
    "collections.view_aging", "collections.assign_accounts", "collections.release_hold",
    "customers.view", "customers.create", "customers.edit", "customers.view_balance",
    "pricing.view_catalogue", "pricing.view_cost", "pricing.approve_price_override",
    "purchasing.view", "purchasing.approve_po",
    "crm.view_leads", "crm.view_dormant",
    "imports.upload", "imports.approve_batch", "imports.view_history",
    "admin.manage_settings", "admin.view_audit_log", "admin.export_reports",
  ], "BRANCH");

  // DISPATCHER
  await assignPerms("DISPATCHER", [
    "orders.view", "orders.create", "orders.edit",
    "dispatch.view_board", "dispatch.assign_truck", "dispatch.reorder_stops", "dispatch.release_route", "dispatch.override_capacity", "dispatch.view_driver_location",
    "delivery.view_routes", "delivery.view_cod_amounts", "delivery.escalate_issue",
    "yard.view_tasks",
    "customers.view",
  ], "BRANCH");

  // DRIVER
  await assignPerms("DRIVER", [
    "orders.view",
    "delivery.view_routes", "delivery.capture_pod", "delivery.capture_cod", "delivery.mark_stop_complete", "delivery.escalate_issue",
    "customers.view",
  ], "ASSIGNED");

  // YARD_MANAGER
  await assignPerms("YARD_MANAGER", [
    "orders.view",
    "yard.view_tasks", "yard.assign_tasks", "yard.complete_task", "yard.mark_ready", "yard.mark_loaded", "yard.log_damage", "yard.adjust_inventory", "yard.approve_cycle_count",
    "receiving.view", "receiving.receive_po",
    "customers.view",
  ], "BRANCH");

  // YARD_WORKER
  await assignPerms("YARD_WORKER", [
    "yard.view_tasks", "yard.complete_task", "yard.mark_ready", "yard.mark_loaded", "yard.log_damage",
  ], "BRANCH");

  // COUNTER_SALES
  await assignPerms("COUNTER_SALES", [
    "orders.view", "orders.create", "orders.edit",
    "customers.view", "customers.create", "customers.edit",
    "pricing.view_catalogue",
    "crm.view_leads", "crm.create_estimate", "crm.edit_estimate",
  ], "BRANCH");

  // OUTSIDE_SALES
  await assignPerms("OUTSIDE_SALES", [
    "orders.view", "orders.create", "orders.edit",
    "customers.view", "customers.create", "customers.edit",
    "pricing.view_catalogue",
    "crm.view_leads", "crm.create_estimate", "crm.edit_estimate", "crm.view_dormant",
  ], "OWN");

  // COLLECTIONS_REP
  await assignPerms("COLLECTIONS_REP", [
    "collections.view_aging", "collections.log_call", "collections.create_promise", "collections.create_dispute", "collections.recommend_hold",
    "customers.view", "customers.view_balance",
    "orders.view",
  ], "ASSIGNED");

  // AR_MANAGER
  await assignPerms("AR_MANAGER", [
    "collections.view_aging", "collections.assign_accounts", "collections.log_call", "collections.create_promise", "collections.create_dispute", "collections.edit_payment_plan", "collections.recommend_hold", "collections.release_hold",
    "customers.view", "customers.edit_credit", "customers.view_balance",
    "orders.view",
  ], "BRANCH");

  // CREDIT_MANAGER
  await assignPerms("CREDIT_MANAGER", [
    "collections.view_aging", "collections.edit_payment_plan", "collections.approve_writeoff", "collections.release_hold",
    "customers.view", "customers.edit_credit", "customers.view_balance",
  ]);

  // PURCHASING
  await assignPerms("PURCHASING", [
    "purchasing.view", "purchasing.create_po", "purchasing.create_rfq", "purchasing.approve_ap_match",
    "receiving.view", "receiving.log_discrepancy", "receiving.approve_receiving", "receiving.create_vendor_issue",
    "pricing.view_catalogue", "pricing.view_cost", "pricing.import_vendor_prices",
    "orders.view", "orders.view_cost",
  ]);

  // RECEIVING_CLERK
  await assignPerms("RECEIVING_CLERK", [
    "receiving.view", "receiving.receive_po", "receiving.log_discrepancy", "receiving.create_vendor_issue",
    "purchasing.view",
  ], "BRANCH");

  // AP_SUPPORT
  await assignPerms("AP_SUPPORT", [
    "purchasing.view", "purchasing.approve_ap_match",
    "receiving.view",
  ]);

  // PRICING
  await assignPerms("PRICING", [
    "pricing.view_catalogue", "pricing.view_cost", "pricing.edit_sell_price", "pricing.approve_price_override", "pricing.import_vendor_prices",
    "orders.view", "orders.view_margin", "orders.view_cost",
  ]);

  // CASHIER
  await assignPerms("CASHIER", [
    "delivery.view_cod_amounts",
    "orders.view",
    "customers.view",
  ], "BRANCH");

  // VIEWER
  await assignPerms("VIEWER", [
    "orders.view", "customers.view", "dispatch.view_board", "delivery.view_routes",
    "yard.view_tasks", "receiving.view", "collections.view_aging", "pricing.view_catalogue",
    "crm.view_leads", "purchasing.view", "imports.view_history",
  ], "READ_ONLY");

  console.log("Assigned permissions to all roles");

  // ============================================================
  // 5. ADMIN USER
  // ============================================================
  const passwordHash = await hash("Admin123!", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@expresslumber.com" },
    update: {},
    create: {
      email: "admin@expresslumber.com",
      passwordHash,
      firstName: "System",
      lastName: "Admin",
      phone: "(973) 555-0101",
      status: "ACTIVE",
      profile: {
        create: {
          title: "System Administrator",
          department: "IT",
          defaultLocationId: mainYard.id,
          timezone: "America/New_York",
        },
      },
    },
  });

  // Assign SUPER_ADMIN role
  const superAdminRoleId = createdRoles["SUPER_ADMIN"];
  if (superAdminRoleId) {
    await prisma.userRoleAssignment.upsert({
      where: {
        userId_roleId_locationId: {
          userId: adminUser.id,
          roleId: superAdminRoleId,
          locationId: mainYard.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: superAdminRoleId,
        locationId: mainYard.id,
        assignedBy: adminUser.id,
        reason: "Initial system setup",
      },
    });
  }

  console.log(`Created admin user: ${adminUser.email}`);

  // ============================================================
  // 6. DEFAULT FEATURE FLAGS
  // ============================================================
  const flags = [
    { code: "module_dispatch", name: "Dispatch Module", category: "modules", defaultState: "ON" as const },
    { code: "module_delivery", name: "Delivery Module", category: "modules", defaultState: "ON" as const },
    { code: "module_yard", name: "Yard Module", category: "modules", defaultState: "ON" as const },
    { code: "module_receiving", name: "Receiving Module", category: "modules", defaultState: "ON" as const },
    { code: "module_collections", name: "Collections Module", category: "modules", defaultState: "ON" as const },
    { code: "module_crm", name: "CRM Module", category: "modules", defaultState: "OFF" as const },
    { code: "module_pricing", name: "Pricing Module", category: "modules", defaultState: "OFF" as const },
    { code: "module_purchasing", name: "Purchasing Module", category: "modules", defaultState: "OFF" as const },
    { code: "module_imports", name: "Import Bridge", category: "modules", defaultState: "OFF" as const },
    { code: "module_reports", name: "Reports Module", category: "modules", defaultState: "OFF" as const },
    { code: "feature_driver_pwa", name: "Driver PWA", category: "features", defaultState: "BETA" as const },
    { code: "feature_ai_extraction", name: "AI PDF Extraction", category: "features", defaultState: "OFF" as const },
    { code: "feature_sms_notifications", name: "SMS Notifications", category: "features", defaultState: "OFF" as const },
  ];

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { code: flag.code },
      update: { name: flag.name },
      create: flag,
    });
  }
  console.log(`Created ${flags.length} feature flags`);

  // ============================================================
  // 7. DEFAULT APPROVAL POLICIES
  // ============================================================
  const policies = [
    {
      name: "Price Override",
      actionType: "price_override",
      entityType: "OrderItem",
      requesterRoles: ["COUNTER_SALES", "OUTSIDE_SALES", "PRICING"],
      approverRoles: ["BRANCH_MANAGER", "PRICING"],
      thresholdField: "marginPercent",
      thresholdMax: new (await import("@prisma/client")).Prisma.Decimal(15),
      timeoutHours: 4,
      escalationRoles: ["GENERAL_MANAGER"],
    },
    {
      name: "Credit Release",
      actionType: "credit_release",
      entityType: "Customer",
      requesterRoles: ["COLLECTIONS_REP", "AR_MANAGER"],
      approverRoles: ["BRANCH_MANAGER", "CREDIT_MANAGER"],
      timeoutHours: 2,
      escalationRoles: ["GENERAL_MANAGER"],
    },
    {
      name: "Write-off Approval",
      actionType: "writeoff",
      entityType: "CollectionAccount",
      requesterRoles: ["AR_MANAGER"],
      approverRoles: ["OWNER", "CREDIT_MANAGER"],
      thresholdField: "amount",
      thresholdMin: new (await import("@prisma/client")).Prisma.Decimal(500),
      timeoutHours: 24,
      escalationRoles: ["OWNER"],
    },
    {
      name: "Truck Overload Override",
      actionType: "truck_overload_override",
      entityType: "Route",
      requesterRoles: ["DISPATCHER"],
      approverRoles: ["BRANCH_MANAGER"],
      timeoutHours: 1,
      escalationRoles: ["GENERAL_MANAGER"],
    },
    {
      name: "Import Batch Approval",
      actionType: "import_batch_approval",
      entityType: "ImportJob",
      requesterRoles: ["SUPER_ADMIN"],
      approverRoles: ["BRANCH_MANAGER", "SUPER_ADMIN"],
      timeoutHours: 8,
      escalationRoles: ["GENERAL_MANAGER"],
    },
  ];

  for (const policy of policies) {
    const existing = await prisma.approvalPolicy.findFirst({
      where: { actionType: policy.actionType },
    });
    if (!existing) {
      await prisma.approvalPolicy.create({
        data: {
          ...policy,
          locationId: null,
          requireReason: true,
          requireAttachment: false,
          isActive: true,
        },
      });
    }
  }
  console.log(`Created ${policies.length} approval policies`);

  console.log("\nSeed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
