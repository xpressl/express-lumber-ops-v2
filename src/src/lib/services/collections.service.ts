import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/events/audit";
import type { Actor } from "@/lib/events/audit-helpers";
import type { CollectionStatus, PromiseStatus } from "@prisma/client";

/** Get aging dashboard data */
export async function getAgingDashboard(locationId?: string, _scopeFilter?: Record<string, unknown>) {
  const where: Prisma.CollectionAccountWhereInput = {
    status: { in: ["ACTIVE", "WATCH", "ESCALATED"] },
    ...(locationId ? { locationId } : {}),
  };

  const accounts = await prisma.collectionAccount.findMany({
    where,
    include: { customer: { select: { companyName: true, accountNumber: true } } },
    orderBy: { currentBalance: "desc" },
    take: 200,
  });

  const summary = {
    totalAccounts: accounts.length,
    totalBalance: accounts.reduce((s, a) => s + Number(a.currentBalance), 0),
    agingCurrent: accounts.reduce((s, a) => s + Number(a.agingCurrent), 0),
    aging30: accounts.reduce((s, a) => s + Number(a.aging30), 0),
    aging60: accounts.reduce((s, a) => s + Number(a.aging60), 0),
    aging90: accounts.reduce((s, a) => s + Number(a.aging90), 0),
    aging120Plus: accounts.reduce((s, a) => s + Number(a.aging120Plus), 0),
  };

  return { accounts, summary };
}

/** List accounts assigned to a collector */
export async function getMyAccounts(collectorId: string, _scopeFilter?: Record<string, unknown>) {
  return prisma.collectionAccount.findMany({
    where: { collectorId, status: { in: ["ACTIVE", "WATCH", "ESCALATED"] } },
    include: { customer: { select: { companyName: true, accountNumber: true } } },
    orderBy: [{ nextActionDate: "asc" }, { currentBalance: "desc" }],
  });
}

/** Get account detail */
export async function getAccountDetail(accountId: string, _scopeFilter?: Record<string, unknown>) {
  return prisma.collectionAccount.findUnique({
    where: { id: accountId },
    include: {
      customer: { select: { companyName: true, accountNumber: true, phone: true } },
      promises: { orderBy: { promiseDate: "desc" }, take: 10 },
      disputes: { orderBy: { createdAt: "desc" }, take: 10 },
      callLogs: { orderBy: { createdAt: "desc" }, take: 20 },
      payments: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
}

/** Log a call */
export async function logCall(accountId: string, input: {
  type: string; direction: string; outcome: string; notes?: string; followUpDate?: string;
}, actor: Actor) {
  const activity = await prisma.collectionActivity.create({
    data: {
      accountId,
      type: input.type,
      direction: input.direction,
      outcome: input.outcome,
      notes: input.notes,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
      createdBy: actor.id,
    },
  });

  await createAuditEvent({
    actorId: actor.id, actorName: actor.name, action: "collections.call_logged",
    entityType: "CollectionActivity", entityId: activity.id,
    metadata: { outcome: input.outcome, type: input.type } as Record<string, unknown>,
  });

  await prisma.collectionAccount.update({
    where: { id: accountId },
    data: {
      lastContactDate: new Date(),
      ...(input.followUpDate ? { nextActionDate: new Date(input.followUpDate) } : {}),
    },
  });

  return activity;
}

/** Create promise to pay */
export async function createPromise(accountId: string, customerId: string, input: {
  amount: number; promiseDate: string; notes?: string;
}, actor: Actor) {
  const promise = await prisma.promiseToPay.create({
    data: {
      accountId,
      customerId,
      amount: input.amount,
      promiseDate: new Date(input.promiseDate),
      notes: input.notes,
      createdBy: actor.id,
    },
  });

  await createAuditEvent({
    actorId: actor.id, actorName: actor.name, action: "collections.promise_created",
    entityType: "PromiseToPay", entityId: promise.id,
    metadata: { amount: input.amount, date: input.promiseDate } as Record<string, unknown>,
  });

  return promise;
}

/** Create dispute */
export async function createDispute(accountId: string, customerId: string, input: {
  invoiceId?: string; amount: number; reason: string; notes?: string;
}, actor: Actor) {
  const dispute = await prisma.dispute.create({
    data: {
      accountId,
      customerId,
      invoiceId: input.invoiceId,
      amount: input.amount,
      reason: input.reason,
      notes: input.notes,
      createdBy: actor.id,
    },
  });

  await createAuditEvent({
    actorId: actor.id, actorName: actor.name, action: "collections.dispute_opened",
    entityType: "Dispute", entityId: dispute.id,
    metadata: { amount: input.amount, reason: input.reason } as Record<string, unknown>,
  });

  return dispute;
}

/** Recommend credit hold */
export async function recommendHold(accountId: string, reason: string, actor: Actor) {
  await prisma.collectionAccount.update({
    where: { id: accountId },
    data: { holdRecommended: true, holdReason: reason },
  });

  await createAuditEvent({
    actorId: actor.id, actorName: actor.name, action: "collections.hold_recommended",
    entityType: "CollectionAccount", entityId: accountId,
    metadata: { reason } as Record<string, unknown>,
  });
}
