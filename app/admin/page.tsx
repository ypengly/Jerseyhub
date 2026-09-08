import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShoppingCart, Users, Package, AlertTriangle, MessageCircle } from "lucide-react";
import { ORDER_STATUS_STYLES } from "@/lib/order-status";
import { SalesChart } from "@/components/admin/sales-chart";
import { subDays, startOfDay } from "date-fns";

export const metadata = { title: "Admin Dashboard — JerseyHub" };

export default async function AdminDashboardPage() {
  const [
    revenueAgg,
    totalOrders,
    totalCustomers,
    totalProducts,
    recentOrders,
    lowStockVariants,
    pendingTelegramOrders,
    topProducts,
    recentReviews,
    dailyOrders,
  ] = await Promise.all([
    db.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { total: true } }),
    db.order.count(),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.product.count(),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { items: true } }),
    db.productVariant.findMany({ where: { stock: { lte: 5, gt: 0 } }, include: { product: true }, orderBy: { stock: "asc" }, take: 6 }),
    db.order.findMany({ where: { paymentMethod: "TELEGRAM", paymentStatus: "PENDING" }, orderBy: { createdAt: "desc" } }),
    db.orderItem.groupBy({ by: ["productName"], _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
    db.order.findMany({
      where: { createdAt: { gte: startOfDay(subDays(new Date(), 13)) } },
      select: { createdAt: true, total: true },
    }),
    db.review.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { user: { select: { name: true } }, product: { select: { name: true } } } }),
  ] as const);

  // Bucket orders by day for the last 14 days for the sales chart.
  const chartData = buildDailySeries(dailyOrders as { createdAt: Date; total: unknown }[]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-wide">DASHBOARD</h1>
        <p className="text-muted-foreground">Overview of your store's performance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="Revenue" value={formatPrice(Number(revenueAgg._sum.total ?? 0))} />
        <StatCard icon={<ShoppingCart className="h-5 w-5" />} label="Orders" value={String(totalOrders)} />
        <StatCard icon={<Users className="h-5 w-5" />} label="Customers" value={String(totalCustomers)} />
        <StatCard icon={<Package className="h-5 w-5" />} label="Products" value={String(totalProducts)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Sales — Last 14 Days</CardTitle></CardHeader>
        <CardContent><SalesChart data={chartData} /></CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><AlertTriangle className="h-5 w-5 text-destructive" /> Low Stock Alerts</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {lowStockVariants.length === 0 ? (
              <p className="text-sm text-muted-foreground">All good — no low stock items.</p>
            ) : (
              lowStockVariants.map((v) => (
                <Link key={v.id} href={`/admin/products/${v.productId}`} className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:border-accent">
                  <span>{v.product.name} — {v.size}</span>
                  <Badge variant="destructive">{v.stock} left</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><MessageCircle className="h-5 w-5 text-accent" /> Pending Manual Payments</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {pendingTelegramOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending Telegram payments.</p>
            ) : (
              pendingTelegramOrders.map((o) => (
                <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:border-accent">
                  <span>Order #{o.orderNumber}</span>
                  <span className="font-semibold">{formatPrice(Number(o.total))}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Top-Selling Products</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {topProducts.map((p, i) => (
              <div key={p.productName} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                <span>#{i + 1} {p.productName}</span>
                <span className="font-semibold">{p._sum.quantity} sold</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Reviews</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentReviews.map((r) => (
              <div key={r.id} className="rounded-md border border-border p-3 text-sm">
                <p className="font-semibold">{r.user.name} · {r.rating}★ · {r.product.name}</p>
                <p className="line-clamp-1 text-muted-foreground">{r.comment}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Orders</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {recentOrders.map((o) => (
            <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:border-accent">
              <div>
                <p className="font-semibold">#{o.orderNumber}</p>
                <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)} · {o.items.length} item(s)</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={ORDER_STATUS_STYLES[o.orderStatus].variant}>{ORDER_STATUS_STYLES[o.orderStatus].label}</Badge>
                <span className="font-semibold">{formatPrice(Number(o.total))}</span>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <div className="rounded-md bg-accent/10 p-2 text-accent">{icon}</div>
        <div>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function buildDailySeries(orders: { createdAt: Date; total: unknown }[]) {
  const days: { date: string; revenue: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = startOfDay(subDays(new Date(), i));
    const label = day.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const revenue = orders
      .filter((o) => startOfDay(new Date(o.createdAt)).getTime() === day.getTime())
      .reduce((sum, o) => sum + Number(o.total), 0);
    days.push({ date: label, revenue: Math.round(revenue * 100) / 100 });
  }
  return days;
}
