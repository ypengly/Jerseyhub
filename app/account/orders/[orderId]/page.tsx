import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { formatDate, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_TIMELINE, STATUS_TIMELINE_LABELS, PAYMENT_STATUS_STYLES } from "@/lib/order-status";
import { TelegramPayCta } from "@/components/account/telegram-pay-cta";

export default async function OrderDetailPage({ params }: { params: { orderId: string } }) {
  const user = await requireUser();
  const order = await db.order.findUnique({ where: { id: params.orderId }, include: { items: true } });

  if (!order || order.userId !== user.id) notFound();

  const currentIndex = order.orderStatus === "CANCELLED" ? -1 : STATUS_TIMELINE.indexOf(order.orderStatus);

  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide">Order #{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <Badge variant={PAYMENT_STATUS_STYLES[order.paymentStatus].variant}>{PAYMENT_STATUS_STYLES[order.paymentStatus].label}</Badge>
      </div>

      {order.paymentMethod === "TELEGRAM" && order.paymentStatus === "PENDING" && (
        <TelegramPayCta orderNumber={order.orderNumber} total={Number(order.total)} />
      )}

      {/* STATUS TIMELINE */}
      {order.orderStatus !== "CANCELLED" ? (
        <div className="mb-10 rounded-xl border border-border p-6">
          <h2 className="mb-4 font-semibold">Order Status</h2>
          <div className="space-y-3">
            {STATUS_TIMELINE.map((status, i) => (
              <div key={status} className="flex items-center gap-3">
                {i <= currentIndex ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                <span className={cn(i <= currentIndex ? "font-medium" : "text-muted-foreground")}>{STATUS_TIMELINE_LABELS[status]}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-10 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
          This order was cancelled.
        </div>
      )}

      {/* ITEMS */}
      <div className="space-y-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex gap-4 rounded-xl border border-border p-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
              {item.productImage && <Image src={item.productImage} alt={item.productName} fill className="object-cover" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{item.productName}</p>
              <p className="text-sm text-muted-foreground">Size: {item.size} × {item.quantity}</p>
              {(item.customName || item.customNumber) && (
                <p className="text-sm text-muted-foreground">Custom: {item.customName} #{item.customNumber}</p>
              )}
            </div>
            <p className="font-semibold">{formatPrice(Number(item.lineTotal))}</p>
          </div>
        ))}
      </div>

      {/* SUMMARY */}
      <div className="mt-8 rounded-xl border border-border p-6">
        <Row label="Subtotal" value={formatPrice(Number(order.subtotal))} />
        {Number(order.discountTotal) > 0 && <Row label="Discount" value={`-${formatPrice(Number(order.discountTotal))}`} />}
        {Number(order.customizationTotal) > 0 && <Row label="Customization" value={formatPrice(Number(order.customizationTotal))} />}
        <Row label="Shipping" value={Number(order.shippingCost) === 0 ? "Free" : formatPrice(Number(order.shippingCost))} />
        <div className="my-3 border-t border-border" />
        <Row label="Total" value={formatPrice(Number(order.total))} bold />
      </div>

      {/* SHIPPING INFO */}
      <div className="mt-6 rounded-xl border border-border p-6 text-sm">
        <h2 className="mb-2 font-semibold">Shipping To</h2>
        <p>{order.fullName}</p>
        <p className="text-muted-foreground">{order.shippingAddress}, {order.city}, {order.country} {order.postalCode}</p>
        <p className="text-muted-foreground">{order.email} · {order.phone}</p>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn("flex justify-between py-0.5", bold && "text-lg font-bold")}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
