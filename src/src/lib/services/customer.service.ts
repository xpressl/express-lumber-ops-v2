import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/events/audit";
import type { CreateCustomerInput, UpdateCustomerInput } from "@/lib/validators/customer";

/** Create customer */
export async function createCustomer(input: CreateCustomerInput, actorId: string) {
  const customer = await prisma.customer.create({
    data: {
      accountNumber: input.accountNumber,
      companyName: input.companyName,
      dba: input.dba,
      type: input.type,
      creditLimit: input.creditLimit ?? 0,
      paymentTerms: input.paymentTerms ?? "NET30",
      taxExempt: input.taxExempt ?? false,
      taxId: input.taxId,
      defaultSalesRepId: input.defaultSalesRepId,
      billingAddress: input.billingAddress as Prisma.InputJsonValue ?? undefined,
      shippingAddress: input.shippingAddress as Prisma.InputJsonValue ?? undefined,
      defaultDeliveryInstructions: input.defaultDeliveryInstructions,
      notes: input.notes,
      locationId: input.locationId,
      createdBy: actorId,
    },
  });

  await createAuditEvent({
    actorId, actorName: "System", action: "customer.created",
    entityType: "Customer", entityId: customer.id, entityName: customer.companyName,
    locationId: input.locationId,
  });

  return customer;
}

/** Update customer */
export async function updateCustomer(customerId: string, input: UpdateCustomerInput, actorId: string) {
  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: {
      ...input,
      billingAddress: input.billingAddress as Prisma.InputJsonValue ?? undefined,
      shippingAddress: input.shippingAddress as Prisma.InputJsonValue ?? undefined,
    },
  });

  await createAuditEvent({
    actorId, actorName: "System", action: "customer.updated",
    entityType: "Customer", entityId: customer.id, entityName: customer.companyName,
  });

  return customer;
}

/** Soft-delete customer */
export async function deleteCustomer(customerId: string, actorId: string) {
  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: { deletedAt: new Date(), status: "CLOSED" },
  });
  await createAuditEvent({
    actorId, actorName: "System", action: "customer.deleted",
    entityType: "Customer", entityId: customer.id, entityName: customer.companyName,
  });
  return customer;
}

/** List customers with search and filters */
export async function listCustomers(params: {
  search?: string;
  status?: string;
  locationId?: string;
  salesRepId?: string;
  tag?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Prisma.CustomerWhereInput = {
    deletedAt: null,
    ...(params.search ? {
      OR: [
        { companyName: { contains: params.search, mode: "insensitive" as const } },
        { accountNumber: { contains: params.search, mode: "insensitive" as const } },
        { dba: { contains: params.search, mode: "insensitive" as const } },
      ],
    } : {}),
    ...(params.status ? { status: params.status as "ACTIVE" | "INACTIVE" | "ON_HOLD" | "COD_ONLY" | "CLOSED" } : {}),
    ...(params.locationId ? { locationId: params.locationId } : {}),
    ...(params.salesRepId ? { defaultSalesRepId: params.salesRepId } : {}),
    ...(params.tag ? { tags: { some: { tag: params.tag } } } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where, include: { tags: true, _count: { select: { contacts: true, orders: true } } },
      skip, take: limit,
      orderBy: { [params.sortBy ?? "companyName"]: params.sortOrder ?? "asc" },
    }),
    prisma.customer.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/** Get customer by ID with full 360 data */
export async function getCustomerById(customerId: string) {
  return prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      contacts: { where: { deletedAt: null }, orderBy: { isPrimary: "desc" } },
      tags: true,
      jobsites: { where: { deletedAt: null } },
      orders: { take: 10, orderBy: { createdAt: "desc" }, select: {
        id: true, orderNumber: true, type: true, status: true, totalAmount: true, requestedDate: true,
      }},
      collectionAccount: true,
    },
  });
}

/** Check if customer can place orders (credit check) */
export async function checkCredit(customerId: string): Promise<{ allowed: boolean; reason?: string }> {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return { allowed: false, reason: "Customer not found" };
  if (customer.status === "ON_HOLD") return { allowed: false, reason: "Account on credit hold" };
  if (customer.status === "CLOSED") return { allowed: false, reason: "Account closed" };
  if (customer.status === "COD_ONLY") return { allowed: true, reason: "COD only - no credit" };

  const balance = Number(customer.currentBalance);
  const limit = Number(customer.creditLimit);
  if (limit > 0 && balance >= limit) {
    return { allowed: false, reason: `Credit limit exceeded: $${balance.toFixed(2)} / $${limit.toFixed(2)}` };
  }

  return { allowed: true };
}
