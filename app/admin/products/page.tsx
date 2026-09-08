import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { DeleteProductButton } from "@/components/admin/delete-product-button";

export default async function AdminProductsPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim();

  const products = await db.product.findMany({
    where: q
      ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { team: { contains: q, mode: "insensitive" } }] }
      : undefined,
    include: { images: { orderBy: { position: "asc" }, take: 1 }, variants: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl tracking-wide">PRODUCTS</h1>
        <Button asChild><Link href="/admin/products/new"><Plus className="mr-2 h-4 w-4" /> New Product</Link></Button>
      </div>

      <form className="mb-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or team..."
          className="h-10 w-full max-w-sm rounded-md border border-border bg-background px-3 text-sm"
        />
      </form>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Team</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
              return (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="flex items-center gap-3 p-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-md bg-muted">
                      {p.images[0] && <Image src={p.images[0].url} alt={p.name} fill className="object-cover" />}
                    </div>
                    <span className="font-medium">{p.name}</span>
                  </td>
                  <td className="p-3">{p.team}</td>
                  <td className="p-3">{formatPrice(Number(p.price))}</td>
                  <td className="p-3">{totalStock === 0 ? <Badge variant="destructive">Out of stock</Badge> : totalStock}</td>
                  <td className="p-3">{p.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge>}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" asChild><Link href={`/admin/products/${p.id}`}>Edit</Link></Button>
                      <DeleteProductButton productId={p.id} productName={p.name} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
