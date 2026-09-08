import { db } from "@/lib/db";
import { InventoryTable } from "@/components/admin/inventory-table";

export default async function AdminInventoryPage() {
  const products = await db.product.findMany({
    include: { variants: true, images: { orderBy: { position: "asc" }, take: 1 } },
    orderBy: { name: "asc" },
  });

  const rows = products.flatMap((p) =>
    p.variants.map((v) => ({
      variantId: v.id,
      productId: p.id,
      productName: p.name,
      image: p.images[0]?.url ?? "/placeholder-jersey.svg",
      size: v.size,
      stock: v.stock,
    }))
  );

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl tracking-wide">INVENTORY</h1>
      <p className="mb-6 text-muted-foreground">Manage stock levels per size across all products.</p>
      <InventoryTable rows={rows} />
    </div>
  );
}
