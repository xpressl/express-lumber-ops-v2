import { hash } from "bcryptjs";
import type { PrismaClient } from "@prisma/client";

/**
 * Seeds Organization Map module data: users, org units, role templates,
 * skills, business tasks, task assignments, and coverage gaps.
 */
export default async function seedOrgMap(prisma: PrismaClient) {
  console.log("Seeding Organization Map...");

  const admin = await prisma.user.findFirst({ where: { email: "admin@expresslumber.com" } });
  const mainYard = await prisma.location.findFirst({ where: { code: "MAIN" } });
  const southBranch = await prisma.location.findFirst({ where: { code: "SOUTH" } });
  if (!admin || !mainYard || !southBranch) throw new Error("Run main seed first");
  const aid = admin.id;
  const pw = await hash("Express123!", 12);

  // ---- 1. USERS ----
  const employees = [
    { email: "mike@expresslumber.com", firstName: "Mike", lastName: "Torres", title: "General Manager", dept: "Management", locId: mainYard.id },
    { email: "sarah@expresslumber.com", firstName: "Sarah", lastName: "Chen", title: "Branch Manager", dept: "Management", locId: mainYard.id },
    { email: "ray@expresslumber.com", firstName: "Ray", lastName: "Johnson", title: "Branch Manager", dept: "Management", locId: southBranch.id },
    { email: "tommy@expresslumber.com", firstName: "Tommy", lastName: "Rizzo", title: "Lead Dispatcher", dept: "Operations", locId: mainYard.id },
    { email: "angela@expresslumber.com", firstName: "Angela", lastName: "Davis", title: "Yard Manager", dept: "Warehouse", locId: mainYard.id },
    { email: "carlos@expresslumber.com", firstName: "Carlos", lastName: "Mendez", title: "Yard Worker", dept: "Warehouse", locId: mainYard.id },
    { email: "darius@expresslumber.com", firstName: "Darius", lastName: "Brown", title: "Driver", dept: "Delivery", locId: mainYard.id },
    { email: "lisa@expresslumber.com", firstName: "Lisa", lastName: "Park", title: "Counter Sales Rep", dept: "Sales", locId: mainYard.id },
    { email: "james@expresslumber.com", firstName: "James", lastName: "O'Brien", title: "AR Manager", dept: "Finance", locId: mainYard.id },
    { email: "nina@expresslumber.com", firstName: "Nina", lastName: "Petrov", title: "Collections Rep", dept: "Finance", locId: mainYard.id },
    { email: "marco@expresslumber.com", firstName: "Marco", lastName: "Silva", title: "Purchasing Agent", dept: "Purchasing", locId: mainYard.id },
    { email: "priya@expresslumber.com", firstName: "Priya", lastName: "Sharma", title: "Pricing Analyst", dept: "Pricing", locId: mainYard.id },
  ];

  const users: Record<string, any> = {};
  for (const e of employees) {
    const u = await prisma.user.upsert({
      where: { email: e.email },
      update: {},
      create: {
        email: e.email, passwordHash: pw, firstName: e.firstName, lastName: e.lastName, status: "ACTIVE",
        profile: { create: { title: e.title, department: e.dept, defaultLocationId: e.locId, timezone: "America/New_York" } },
      },
    });
    users[e.email] = u;
  }
  console.log(`Created ${employees.length} org-map users`);

  // ---- 2. ORGANIZATION UNITS ----
  const ou = async (code: string, name: string, type: string, parentId: string | null, headId: string | null, locationId: string | null, sort: number) =>
    prisma.organizationUnit.upsert({
      where: { code }, update: {},
      create: { code, name, type, parentId, headId, locationId, status: "ACTIVE", sortOrder: sort, createdBy: aid },
    });

  const company = await ou("EL-CO", "Express Lumber Co", "COMPANY", null, aid, null, 0);
  const neRegion = await ou("EL-NE", "Northeast Region", "REGION", company.id, users["mike@expresslumber.com"].id, null, 1);

  const mainBranch = await ou("EL-MAIN", "Main Yard Branch", "BRANCH", neRegion.id, users["sarah@expresslumber.com"].id, mainYard.id, 1);
  const mainOps = await ou("EL-MAIN-OPS", "Operations Dept", "DEPARTMENT", mainBranch.id, users["tommy@expresslumber.com"].id, mainYard.id, 1);
  const mainOpsDsp = await ou("EL-MAIN-OPS-DSP", "Dispatch Team", "TEAM", mainOps.id, users["tommy@expresslumber.com"].id, mainYard.id, 1);
  const mainOpsDlv = await ou("EL-MAIN-OPS-DLV", "Delivery Team", "TEAM", mainOps.id, null, mainYard.id, 2);
  const mainWh = await ou("EL-MAIN-WH", "Warehouse Dept", "DEPARTMENT", mainBranch.id, users["angela@expresslumber.com"].id, mainYard.id, 2);
  const mainWhYrd = await ou("EL-MAIN-WH-YRD", "Yard Team", "TEAM", mainWh.id, users["angela@expresslumber.com"].id, mainYard.id, 1);
  const mainWhRcv = await ou("EL-MAIN-WH-RCV", "Receiving Team", "TEAM", mainWh.id, null, mainYard.id, 2);
  const mainSls = await ou("EL-MAIN-SLS", "Sales Dept", "DEPARTMENT", mainBranch.id, users["lisa@expresslumber.com"].id, mainYard.id, 3);
  const mainFin = await ou("EL-MAIN-FIN", "Finance Dept", "DEPARTMENT", mainBranch.id, users["james@expresslumber.com"].id, mainYard.id, 4);
  const mainFinAr = await ou("EL-MAIN-FIN-AR", "AR Team", "TEAM", mainFin.id, users["james@expresslumber.com"].id, mainYard.id, 1);
  const mainFinAp = await ou("EL-MAIN-FIN-AP", "AP Team", "TEAM", mainFin.id, null, mainYard.id, 2);

  const southBr = await ou("EL-SOUTH", "South Branch", "BRANCH", neRegion.id, users["ray@expresslumber.com"].id, southBranch.id, 2);
  const southOps = await ou("EL-SOUTH-OPS", "Operations Dept", "DEPARTMENT", southBr.id, null, southBranch.id, 1);
  const southWh = await ou("EL-SOUTH-WH", "Warehouse Dept", "DEPARTMENT", southBr.id, null, southBranch.id, 2);
  const southSls = await ou("EL-SOUTH-SLS", "Sales Dept", "DEPARTMENT", southBr.id, null, southBranch.id, 3);
  console.log("Created 17 organization units");

  // ---- 3. ROLE TEMPLATES ----
  const rt = async (title: string, orgUnitId: string | null, summary: string, mission: string, criticality: string, headcount: number) =>
    prisma.roleTemplate.create({
      data: { title, orgUnitId, summary, mission, criticality, targetHeadcount: headcount, status: "ACTIVE", createdBy: aid },
    });

  const rtGM = await rt("General Manager", company.id, "Overall operations leadership", "Drive operational excellence across all branches", "HIGH", 1);
  const rtBM = await rt("Branch Manager", neRegion.id, "Branch-level operational management", "Ensure branch meets revenue and service targets", "HIGH", 2);
  const rtLD = await rt("Lead Dispatcher", mainOps.id, "Dispatch operations leadership", "Optimize daily route assignments and on-time delivery", "HIGH", 1);
  const rtDisp = await rt("Dispatcher", mainOpsDsp.id, "Route and truck assignment", "Assign trucks to stops efficiently each day", "MEDIUM", 2);
  const rtYM = await rt("Yard Manager", mainWh.id, "Yard operations leadership", "Keep yard organized and orders prepped on time", "HIGH", 1);
  const rtYW = await rt("Yard Worker", mainWhYrd.id, "Yard task execution", "Pull, stage, and load orders accurately", "MEDIUM", 3);
  const rtDrv = await rt("Driver", mainOpsDlv.id, "Delivery execution", "Complete deliveries safely and collect signatures/COD", "MEDIUM", 4);
  const rtCS = await rt("Counter Sales Rep", mainSls.id, "Walk-in customer service", "Process walk-in orders and maintain customer relationships", "MEDIUM", 2);
  const rtOS = await rt("Outside Sales Rep", mainSls.id, "Field sales and estimates", "Grow revenue through new and existing customer accounts", "LOW", 2);
  const rtARM = await rt("AR Manager", mainFinAr.id, "Accounts receivable leadership", "Minimize past-due balances and manage collection team", "HIGH", 1);
  const rtCR = await rt("Collections Rep", mainFinAr.id, "Collections execution", "Recover outstanding balances through systematic outreach", "MEDIUM", 2);
  const rtPA = await rt("Purchasing Agent", company.id, "Vendor management and purchasing", "Maintain optimal inventory levels at best cost", "MEDIUM", 1);
  const rtPR = await rt("Pricing Analyst", company.id, "Pricing strategy execution", "Maintain competitive margins across product catalog", "MEDIUM", 1);
  const rtRC = await rt("Receiving Clerk", mainWhRcv.id, "Inbound receiving execution", "Accurately receive and verify all inbound purchase orders", "MEDIUM", 2);
  console.log("Created 14 role templates");

  // ---- 4. SKILLS ----
  const skills: Record<string, any> = {};
  const skillData = [
    { name: "Forklift Operation", category: "Equipment" },
    { name: "CDL Driving", category: "Certification" },
    { name: "Lumber Grading", category: "Product Knowledge" },
    { name: "Customer Negotiation", category: "Sales" },
    { name: "Credit Analysis", category: "Finance" },
    { name: "Route Planning", category: "Operations" },
    { name: "Inventory Management", category: "Warehouse" },
    { name: "ERP System", category: "Technology" },
  ];
  for (const s of skillData) {
    skills[s.name] = await prisma.skill.upsert({ where: { name: s.name }, update: {}, create: s });
  }
  console.log(`Created ${skillData.length} skills`);

  // ---- 5. BUSINESS TASKS ----
  const bt = async (name: string, cat: string, area: string, freq: string, risk: string, critical: boolean) =>
    prisma.businessTask.create({ data: { name, category: cat, processArea: area, frequency: freq, riskLevel: risk, isCritical: critical, status: "ACTIVE", createdBy: aid } });

  const tasks: Record<string, any> = {};
  const taskList: [string, string, string, string, string, boolean][] = [
    ["Review and release dispatch board", "Operations", "Dispatch", "DAILY", "CRITICAL", true],
    ["Assign trucks to routes", "Operations", "Dispatch", "DAILY", "HIGH", false],
    ["Complete morning yard prep", "Warehouse", "Yard", "DAILY", "HIGH", true],
    ["Load outbound trucks", "Warehouse", "Yard", "DAILY", "HIGH", true],
    ["Receive inbound POs", "Warehouse", "Receiving", "DAILY", "MEDIUM", false],
    ["Verify delivery PODs", "Delivery", "Delivery", "DAILY", "HIGH", false],
    ["Process COD collections", "Finance", "Collections", "DAILY", "HIGH", true],
    ["Review AR aging report", "Finance", "Collections", "DAILY", "HIGH", false],
    ["Make collection calls", "Finance", "Collections", "DAILY", "MEDIUM", false],
    ["Process walk-in orders", "Sales", "Counter Sales", "DAILY", "MEDIUM", false],
    ["Create customer estimates", "Sales", "CRM", "DAILY", "MEDIUM", false],
    ["Review price change requests", "Pricing", "Pricing", "WEEKLY", "HIGH", false],
    ["Run inventory cycle count", "Warehouse", "Inventory", "WEEKLY", "MEDIUM", false],
    ["Review vendor PO status", "Purchasing", "Purchasing", "WEEKLY", "MEDIUM", false],
    ["Reconcile AP invoices", "Finance", "AP", "WEEKLY", "HIGH", false],
    ["Process credit applications", "Finance", "Credit", "WEEKLY", "HIGH", true],
    ["Review dormant accounts", "Sales", "CRM", "MONTHLY", "LOW", false],
    ["Audit pricing margins", "Pricing", "Pricing", "MONTHLY", "HIGH", false],
    ["Branch P&L review", "Finance", "Reporting", "MONTHLY", "HIGH", true],
    ["Update vendor price books", "Purchasing", "Purchasing", "QUARTERLY", "MEDIUM", false],
  ];
  for (const [name, cat, area, freq, risk, crit] of taskList) {
    tasks[name] = await bt(name, cat, area, freq, risk, crit);
  }
  console.log(`Created ${taskList.length} business tasks`);

  // ---- 6. TASK ASSIGNMENTS (RACI) ----
  const ta = async (taskName: string, roleId: string | null, userId: string | null, type: string) =>
    prisma.taskAssignment.create({ data: { taskId: tasks[taskName].id, roleTemplateId: roleId, userId, assignmentType: type, createdBy: aid } });

  await ta("Review and release dispatch board", rtLD.id, null, "RESPONSIBLE");
  await ta("Review and release dispatch board", rtBM.id, null, "ACCOUNTABLE");
  await ta("Assign trucks to routes", rtDisp.id, null, "RESPONSIBLE");
  await ta("Assign trucks to routes", rtLD.id, null, "ACCOUNTABLE");
  await ta("Complete morning yard prep", rtYW.id, null, "RESPONSIBLE");
  await ta("Complete morning yard prep", rtYM.id, null, "ACCOUNTABLE");
  await ta("Load outbound trucks", rtYW.id, null, "RESPONSIBLE");
  await ta("Verify delivery PODs", rtDrv.id, null, "RESPONSIBLE");
  await ta("Process COD collections", null, users["james@expresslumber.com"].id, "RESPONSIBLE");
  await ta("Review AR aging report", rtARM.id, null, "RESPONSIBLE");
  await ta("Make collection calls", rtCR.id, null, "RESPONSIBLE");
  await ta("Process walk-in orders", rtCS.id, null, "RESPONSIBLE");
  await ta("Review price change requests", rtPR.id, null, "RESPONSIBLE");
  await ta("Review vendor PO status", rtPA.id, null, "RESPONSIBLE");
  await ta("Branch P&L review", rtBM.id, null, "ACCOUNTABLE");
  console.log("Created 15 task assignments");

  // ---- 7. COVERAGE GAPS ----
  await prisma.coverageGap.create({ data: {
    gapType: "NO_OWNER", severity: "MEDIUM", taskId: tasks["Update vendor price books"].id,
    summary: "No one is assigned to update vendor price books quarterly", recommendedAction: "Assign purchasing agent as owner",
  } });
  await prisma.coverageGap.create({ data: {
    gapType: "NO_BACKUP", severity: "HIGH", taskId: tasks["Review and release dispatch board"].id, roleTemplateId: rtLD.id,
    summary: "Lead Dispatcher has no backup for dispatch board release", recommendedAction: "Cross-train a dispatcher or branch manager",
  } });
  await prisma.coverageGap.create({ data: {
    gapType: "SINGLE_POINT_OF_FAILURE", severity: "CRITICAL", roleTemplateId: rtARM.id, userId: users["james@expresslumber.com"].id,
    summary: "AR Manager is a single point of failure for collections oversight", recommendedAction: "Train a senior collections rep as backup",
  } });
  await prisma.coverageGap.create({ data: {
    gapType: "MISSING_ROLE", severity: "HIGH", orgUnitId: southWh.id, locationId: southBranch.id,
    summary: "South branch has no dedicated yard manager", recommendedAction: "Hire or transfer a yard manager to South branch",
  } });
  await prisma.coverageGap.create({ data: {
    gapType: "SKILL_MISMATCH", severity: "MEDIUM", userId: users["carlos@expresslumber.com"].id, roleTemplateId: rtYW.id,
    summary: "Yard worker Carlos Mendez lacks forklift certification", recommendedAction: "Schedule forklift certification training",
  } });
  console.log("Created 5 coverage gaps");

  console.log("Organization Map seed complete!");
}
