import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/utils";
import { OrderStatusControls } from "@/components/admin/order-status-controls";

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await db.order.findUnique({ where: { id: params.id }, include: { items: true, user: true } });
  if (!order) notFound();

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide">Order #{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">Placed {formatDate(order.createdAt)} by {order.user.name} ({order.user.email})</p>
        </div>
      </div>

      <OrderStatusControls orderId={order.id} currentPaymentStatus={order.paymentStatus} currentOrderStatus={order.orderStatus} paymentMethod={order.paymentMethod} />

      <div className="mt-6 space-y-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex gap-4 rounded-xl border border-border p-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
              {item.productImage && <Image src={item.productImage} alt={item.productName} fill className="object-cover" />}
            </div>
            <div className="flex-1 text-sm">
              <p className="font-semibold">{item.productName}</p>
              <p className="text-muted-foreground">Size: {item.size} × {item.quantity}</p>
              {(item.customName || item.customNumber) && <p className="text-muted-foreground">Custom: {item.customName} #{item.customNumber} (+{formatPrice(Number(item.customizationPrice))})</p>}
            </div>
            <p className="font-semibold">{formatPrice(Number(item.lineTotal))}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-5 text-sm">
          <h2 className="mb-2 font-semibold">Order Summary</h2>
          <Row label="Subtotal" value={formatPrice(Number(order.subtotal))} />
          <Row label="Discount" value={`-${formatPrice(Number(order.discountTotal))}`} />
          <Row label="Customization" value={formatPrice(Number(order.customizationTotal))} />
          <Row label="Shipping" value={formatPrice(Number(order.shippingCost))} />
          <div className="my-2 border-t border-border" />
          <Row label="Total" value={formatPrice(Number(order.total))} bold />
        </div>
        <div className="rounded-xl border border-border p-5 text-sm">
          <h2 className="mb-2 font-semibold">Shipping Details</h2>
          <p>{order.fullName}</p>
          <p className="text-muted-foreground">{order.shippingAddress}, {order.city}, {order.country} {order.postalCode}</p>
          <p className="text-muted-foreground">{order.email} · {order.phone}</p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
