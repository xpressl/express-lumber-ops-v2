import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/events/audit";
import type { CreateProductInput, UpdateProductInput } from "@/lib/validators/product";

export async function createProduct(input: CreateProductInput, actorId: string) {
  const marginPercent = input.currentSell > 0
    ? ((input.currentSell - input.currentCost) / input.currentSell) * 100
    : 0;

  const product = await prisma.product.create({
    data: { ...input, marginPercent },
  });

  await createAuditEvent({
    actorId, actorName: "System", action: "product.created",
    entityType: "Product", entityId: product.id, entityName: `${product.sku} - ${product.name}`,
    locationId: input.locationId,
  });

  return product;
}

export async function updateProduct(productId: string, input: UpdateProductInput, actorId: string) {
  const product = await prisma.product.update({
    where: { id: productId },
    data: input,
  });

  await createAuditEvent({
    actorId, actorName: "System", action: "product.updated",
    entityType: "Product", entityId: product.id, entityName: `${product.sku} - ${product.name}`,
  });

  return product;
}

export async function listProducts(params: {
  search?: string;
  categoryId?: string;
  status?: string;
  vendorId?: string;
  locationId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(params.search ? {
      OR: [
        { sku: { contains: params.search, mode: "insensitive" as const } },
        { name: { contains: params.search, mode: "insensitive" as const } },
      ],
    } : {}),
    ...(params.categoryId ? { categoryId: params.categoryId } : {}),
    ...(params.status ? { status: params.status as "ACTIVE" | "DISCONTINUED" | "SPECIAL_ORDER" } : {}),
    ...(params.vendorId ? { primaryVendorId: params.vendorId } : {}),
    ...(params.locationId ? { locationId: params.locationId } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, primaryVendor: { select: { name: true } } },
      skip, take: limit,
      orderBy: { [params.sortBy ?? "sku"]: params.sortOrder ?? "asc" },
    }),
    prisma.product.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getProductById(productId: string) {
  return prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      primaryVendor: true,
      costHistory: { take: 10, orderBy: { effectiveAt: "desc" } },
      vendorPrices: { where: { isActive: true }, include: { vendor: { select: { name: true } } } },
      inventoryBalances: true,
    },
  });
}
