"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/authz";
import { notify } from "@/lib/notifications";
import { OrderStatus, PaymentStatus } from "@prisma/client";

/**
 * Marks a pending Telegram order as paid. This is the only place stock is
 * decremented for a manual-payment order — mirroring the instant decrement
 * that happens for sandbox ONLINE orders at creation time, so stock is
 * always reduced exactly once, at the moment an order becomes CONFIRMED.
 */
export async function markOrderPaid(orderId: string) {
  const auth = await requireAdminApi();
  if ("error" in auth) return { error: auth.error };

  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { error: "Order not found" };
  if (order.paymentStatus === "PAID") return { error: "Order is already paid" };

  await db.$transaction(async (tx) => {
    for (const item of order.items) {
      const variant = await tx.productVariant.findUnique({
        where: { productId_size: { productId: item.productId, size: item.size } },
      });
      if (variant) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: Math.min(item.quantity, variant.stock) } },
        });
      }
    }
    await tx.order.update({ where: { id: orderId }, data: { paymentStatus: "PAID", orderStatus: "CONFIRMED" } });
  });

  await notify({
    userId: order.userId,
    title: "Payment confirmed",
    message: `Your order #${order.orderNumber} has been confirmed.`,
    type: "PAYMENT_CONFIRMED",
    link: `/account/orders/${order.id}`,
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  return { success: true };
}

export async function updatePaymentStatus(orderId: string, status: PaymentStatus) {
  const auth = await requireAdminApi();
  if ("error" in auth) return { error: auth.error };

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Order not found" };

  if (status === "PAID" && order.paymentStatus !== "PAID") {
    // Route through markOrderPaid so inventory is decremented consistently.
    return markOrderPaid(orderId);
  }

  await db.order.update({ where: { id: orderId }, data: { paymentStatus: status } });

  if (status === "FAILED") {
    await notify({
      userId: order.userId,
      title: "Payment failed",
      message: `Payment for order #${order.orderNumber} could not be completed.`,
      type: "PAYMENT_FAILED",
      link: `/account/orders/${order.id}`,
    });
  }

  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

const STATUS_NOTIFICATIONS: Partial<Record<OrderStatus, { title: string; message: (n: string) => string; type: "ORDER_PROCESSING" | "ORDER_SHIPPED" | "ORDER_DELIVERED" }>> = {
  PROCESSING: { title: "Order processing", message: (n) => `Order #${n} is now being processed.`, type: "ORDER_PROCESSING" },
  SHIPPED: { title: "Order shipped", message: (n) => `Order #${n} has shipped!`, type: "ORDER_SHIPPED" },
  DELIVERED: { title: "Order delivered", message: (n) => `Order #${n} has been delivered.`, type: "ORDER_DELIVERED" },
};

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const auth = await requireAdminApi();
  if ("error" in auth) return { error: auth.error };

  const order = await db.order.update({ where: { id: orderId }, data: { orderStatus: status } });

  const notifConfig = STATUS_NOTIFICATIONS[status];
  if (notifConfig) {
    await notify({
      userId: order.userId,
      title: notifConfig.title,
      message: notifConfig.message(order.orderNumber),
      type: notifConfig.type,
      link: `/account/orders/${order.id}`,
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
  return { success: true };
}
