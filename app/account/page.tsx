import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { formatDate, formatPrice } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Clock, CheckCircle2, Heart, ShoppingBag, ListOrdered } from "lucide-react";
import { ORDER_STATUS_STYLES } from "@/lib/order-status";

export default async function AccountDashboardPage() {
  const user = await requireUser();

  const [orders, wishlistCount, recentNotifications] = await Promise.all([
    db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5, include: { items: true } }),
    db.wishlistItem.count({ where: { wishlist: { userId: user.id } } }),
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const totalOrders = await db.order.count({ where: { userId: user.id } });
  const pendingOrders = await db.order.count({ where: { userId: user.id, orderStatus: { in: ["PENDING_PAYMENT", "PROCESSING"] } } });
  const completedOrders = await db.order.count({ where: { userId: user.id, orderStatus: "DELIVERED" } });

  return (
    <div className="container py-10">
      <h1 className="font-display text-4xl tracking-wide">Welcome back, {user.name?.split(" ")[0]}</h1>
      <p className="mt-1 text-muted-foreground">Here's what's happening with your account.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={<ListOrdered className="h-5 w-5" />} label="Total Orders" value={totalOrders} />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Pending Orders" value={pendingOrders} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Completed" value={completedOrders} />
        <StatCard icon={<Heart className="h-5 w-5" />} label="Wishlist" value={wishlistCount} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-wide">Recent Orders</h2>
            <Link href="/account/orders" className="text-sm font-semibold text-accent">View all</Link>
          </div>
          {orders.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No orders yet.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <Link key={o.id} href={`/account/orders/${o.id}`} className="flex items-center justify-between rounded-lg border border-border p-4 hover:border-accent">
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
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-4 font-display text-2xl tracking-wide">Quick Actions</h2>
          <div className="space-y-3">
            <Button asChild className="w-full justify-start" variant="outline"><Link href="/shop"><ShoppingBag className="mr-2 h-4 w-4" />Shop Now</Link></Button>
            <Button asChild className="w-full justify-start" variant="outline"><Link href="/account/orders"><Package className="mr-2 h-4 w-4" />View Orders</Link></Button>
            <Button asChild className="w-full justify-start" variant="outline"><Link href="/account/wishlist"><Heart className="mr-2 h-4 w-4" />View Wishlist</Link></Button>
          </div>

          <h2 className="mb-4 mt-8 font-display text-2xl tracking-wide">Recent Notifications</h2>
          {recentNotifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            <div className="space-y-2">
              {recentNotifications.map((n) => (
                <div key={n.id} className="rounded-md border border-border p-3 text-sm">
                  <p className="font-semibold">{n.title}</p>
                  <p className="text-muted-foreground">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
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
