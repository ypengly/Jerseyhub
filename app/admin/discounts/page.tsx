import { db } from "@/lib/db";
import { DiscountManager } from "@/components/admin/discount-manager";

export default async function AdminDiscountsPage() {
  const [discounts, products] = await Promise.all([
    db.discount.findMany({ include: { product: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
    db.product.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const now = new Date();
  const serialized = discounts.map((d) => ({
    id: d.id,
    productId: d.productId,
    productName: d.product.name,
    type: d.type,
    value: Number(d.value),
    label: d.label,
    startDate: d.startDate.toISOString(),
    endDate: d.endDate.toISOString(),
    isActive: d.isActive,
    isCurrentlyActive: d.isActive && d.startDate <= now && d.endDate >= now,
  }));

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl tracking-wide">DISCOUNTS</h1>
      <DiscountManager discounts={serialized} products={products} />
    </div>
  );
}
