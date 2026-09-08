import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_STYLES, PAYMENT_STATUS_STYLES } from "@/lib/order-status";
import { OrderStatus } from "@prisma/client";

export default async function AdminOrdersPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  const q = searchParams.q?.trim();
  const status = searchParams.status as OrderStatus | undefined;

  const orders = await db.order.findMany({
    where: {
      ...(status ? { orderStatus: status } : {}),
      ...(q ? { OR: [{ orderNumber: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { fullName: { contains: q, mode: "insensitive" } }] } : {}),
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const statuses: OrderStatus[] = ["PENDING_PAYMENT", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl tracking-wide">ORDERS</h1>

      <form className="mb-4 flex flex-wrap gap-3">
        <input name="q" defaultValue={q} placeholder="Search order #, name, or email..." className="h-10 flex-1 min-w-[220px] rounded-md border border-border bg-background px-3 text-sm" />
        <select name="status" defaultValue={status ?? ""} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{ORDER_STATUS_STYLES[s].label}</option>)}
        </select>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Items</th>
              <th className="p-3">Total</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50">
                <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-semibold hover:text-accent">#{o.orderNumber}</Link></td>
                <td className="p-3">{o.fullName}<br /><span className="text-xs text-muted-foreground">{o.email}</span></td>
                <td className="p-3">{o.items.length}</td>
                <td className="p-3 font-semibold">{formatPrice(Number(o.total))}</td>
                <td className="p-3">
                  <Badge variant={PAYMENT_STATUS_STYLES[o.paymentStatus].variant}>{PAYMENT_STATUS_STYLES[o.paymentStatus].label}</Badge>
                  <span className="ml-1 text-xs text-muted-foreground">{o.paymentMethod}</span>
                </td>
                <td className="p-3"><Badge variant={ORDER_STATUS_STYLES[o.orderStatus].variant}>{ORDER_STATUS_STYLES[o.orderStatus].label}</Badge></td>
                <td className="p-3 text-xs text-muted-foreground">{formatDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="p-6 text-center text-muted-foreground">No orders found.</p>}
      </div>
    </div>
  );
}
