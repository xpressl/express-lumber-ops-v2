import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/events/audit";
import { createException } from "@/lib/exceptions/engine";

/** Get cost changes with severity classification */
export async function getCostChanges(params: { dateFrom?: string; dateTo?: string; locationId?: string; scopeFilter?: Record<string, unknown> }) {
  const where: Prisma.ProductCostHistoryWhereInput = {};
  if (params.dateFrom || params.dateTo) {
    where.effectiveAt = {
      ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
      ...(params.dateTo ? { lte: new Date(params.dateTo) } : {}),
    };
  }

  return prisma.productCostHistory.findMany({
    where,
    include: { product: { select: { sku: true, name: true, currentSell: true } } },
    orderBy: { effectiveAt: "desc" },
    take: 100,
  });
}

/** Record a cost change and check margin impact */
export async function recordCostChange(
  productId: string, oldCost: number, newCost: number, source: string, vendorId?: string, actorId?: string,
) {
  const changePercent = oldCost > 0 ? ((newCost - oldCost) / oldCost) * 100 : 0;

  const history = await prisma.productCostHistory.create({
    data: { productId, oldCost, newCost, changePercent, source, vendorId, changedBy: actorId },
  });

  // Fetch current sell price before updating
  const currentProduct = await prisma.product.findUnique({ where: { id: productId }, select: { currentSell: true } });
  const sellPrice = currentProduct ? Number(currentProduct.currentSell) : 0;
  const newMargin = sellPrice > 0 ? ((sellPrice - newCost) / sellPrice) * 100 : 0;

  // Update product current cost and recalculated margin
  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      currentCost: newCost,
      marginPercent: newMargin,
    },
  });

  // Check margin - create exception if below threshold
  const margin = product.marginPercent ? Number(product.marginPercent) : 0;
  if (margin < 10) {
    await createException({
      category: "PRICE_MARGIN_RISK",
      title: `Low margin: ${product.sku} at ${margin.toFixed(1)}%`,
      description: `Cost changed ${changePercent.toFixed(1)}% (${oldCost} → ${newCost})`,
      entityType: "Product", entityId: productId, entityName: `${product.sku} - ${product.name}`,
      locationId: product.locationId,
    });
  }

  return history;
}

/** Get quotes at risk from cost changes */
export async function getQuotesAtRisk(_scopeFilter?: Record<string, unknown>) {
  const recentChanges = await prisma.productCostHistory.findMany({
    where: { effectiveAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    select: { productId: true },
  });
  const productIds = [...new Set(recentChanges.map((c) => c.productId))];

  return prisma.estimate.findMany({
    where: {
      deletedAt: null,
      status: { in: ["SENT", "VIEWED", "FOLLOW_UP"] },
      lines: { some: { productId: { in: productIds } } },
    },
    include: { lines: true, _count: { select: { lines: true } } },
    orderBy: { totalAmount: "desc" },
  });
}

