import { prisma } from "@/lib/prisma";

export interface SearchResult {
  id: string;
  type: string;
  label: string;
  description?: string;
  href: string;
}

/** Universal search across all major entities */
export async function search(query: string, _scopeFilter?: Record<string, unknown>, limit = 20): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];
  const results: SearchResult[] = [];
  const q = query.toLowerCase();

  // Orders
  const orders = await prisma.order.findMany({
    where: { deletedAt: null, OR: [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { customerPO: { contains: q, mode: "insensitive" } },
    ]},
    select: { id: true, orderNumber: true, status: true },
    take: 5,
  });
  results.push(...orders.map((o) => ({ id: o.id, type: "Order", label: o.orderNumber, description: o.status, href: `/orders/${o.id}` })));

  // Customers
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null, OR: [
      { companyName: { contains: q, mode: "insensitive" } },
      { accountNumber: { contains: q, mode: "insensitive" } },
    ]},
    select: { id: true, companyName: true, accountNumber: true },
    take: 5,
  });
  results.push(...customers.map((c) => ({ id: c.id, type: "Customer", label: c.companyName, description: c.accountNumber, href: `/customers/${c.id}` })));

  // Products
  const products = await prisma.product.findMany({
    where: { deletedAt: null, OR: [
      { sku: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ]},
    select: { id: true, sku: true, name: true },
    take: 5,
  });
  results.push(...products.map((p) => ({ id: p.id, type: "Product", label: `${p.sku} - ${p.name}`, href: `/products/${p.id}` })));

  // Vendors
  const vendors = await prisma.vendor.findMany({
    where: { deletedAt: null, OR: [
      { name: { contains: q, mode: "insensitive" } },
      { code: { contains: q, mode: "insensitive" } },
    ]},
    select: { id: true, name: true, code: true },
    take: 3,
  });
  results.push(...vendors.map((v) => ({ id: v.id, type: "Vendor", label: v.name, description: v.code, href: `/purchasing/vendors/${v.id}` })));

  return results.slice(0, limit);
}
