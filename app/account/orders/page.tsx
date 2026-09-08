import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { formatDate, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_STYLES } from "@/lib/order-status";
import { Package } from "lucide-react";

export default async function OrderHistoryPage() {
  const user = await requireUser();
  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="container py-10">
      <h1 className="mb-8 font-display text-4xl tracking-wide">ORDER HISTORY</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center">
          <Package className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="font-display text-2xl tracking-wide">No orders yet</p>
          <Button asChild className="mt-6"><Link href="/shop">Start Shopping</Link></Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Link key={o.id} href={`/account/orders/${o.id}`} className="block rounded-xl border border-border p-5 hover:border-accent">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Order #{o.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)} · {o.items.length} item(s)</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={ORDER_STATUS_STYLES[o.orderStatus].variant}>{ORDER_STATUS_STYLES[o.orderStatus].label}</Badge>
                  <span className="font-bold">{formatPrice(Number(o.total))}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
