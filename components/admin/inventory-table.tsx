"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { updateVariantStock } from "@/app/actions/admin/product-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Row = { variantId: string; productId: string; productName: string; image: string; size: string; stock: number };

export function InventoryTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, number>>(Object.fromEntries(rows.map((r) => [r.variantId, r.stock])));
  const [isPending, startTransition] = useTransition();

  function commit(variantId: string) {
    startTransition(async () => {
      const res = await updateVariantStock(variantId, values[variantId]);
      if (res?.error) toast.error(res.error);
      router.refresh();
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="p-3">Product</th>
            <th className="p-3">Size</th>
            <th className="p-3">Stock</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.variantId} className="border-b border-border last:border-0">
              <td className="flex items-center gap-3 p-3">
                <div className="relative h-9 w-9 overflow-hidden rounded-md bg-muted">
                  <Image src={r.image} alt={r.productName} fill className="object-cover" />
                </div>
                {r.productName}
              </td>
              <td className="p-3 font-semibold">{r.size}</td>
              <td className="p-3">
                <Input
                  type="number"
                  className="w-24"
                  value={values[r.variantId]}
                  onChange={(e) => setValues((v) => ({ ...v, [r.variantId]: parseInt(e.target.value) || 0 }))}
                  onBlur={() => commit(r.variantId)}
                  disabled={isPending}
                />
              </td>
              <td className="p-3">
                {values[r.variantId] === 0 ? <Badge variant="destructive">Out of stock</Badge> : values[r.variantId] <= 5 ? <Badge variant="outline">Low stock</Badge> : <Badge variant="success">In stock</Badge>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
