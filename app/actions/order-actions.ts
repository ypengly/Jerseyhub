"use server";

import { db } from "@/lib/db";
import { requireUserApi } from "@/lib/authz";
import { checkoutSchema } from "@/lib/validations";
import { priceLineItem, calculateTotals } from "@/lib/pricing";
import { getStoreSettings } from "@/lib/queries";
import { generateOrderNumber } from "@/lib/utils";
import { notify, notifyAdmins } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

/**
 * Creates an order from the customer's current (non-saved-for-later) cart
 * items. All prices, discounts, and totals are recomputed server-side from
 * the database — nothing from the client is trusted for money math.
 *
 * ONLINE payments are confirmed immediately via the sandbox flow (never a
 * real charge). TELEGRAM orders are left PENDING_PAYMENT until an admin
 * manually marks them paid after the customer pays out-of-band.
 */
export async function createOrder(input: {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  paymentMethod: "ONLINE" | "TELEGRAM";
}) {
  const auth = await requireUserApi();
  if ("error" in auth) return { error: auth.error };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid checkout details" };

  const cart = await db.cart.findUnique({
    where: { userId: auth.user.id },
    include: {
      items: {
        where: { savedForLater: false },
        include: { product: { include: { discounts: true, variants: true, images: { orderBy: { position: "asc" } } } } },
      },
    },
  });

  if (!cart || cart.items.length === 0) return { error: "Your cart is empty" };

  // Verify stock for every line before creating anything.
  for (const item of cart.items) {
    const variant = item.product.variants.find((v) => v.size === item.size);
    if (!variant || variant.stock < item.quantity) {
      return { error: `${item.product.name} (size ${item.size}) no longer has enough stock` };
    }
  }

  const lines = cart.items.map((item) =>
    priceLineItem({
      product: item.product,
      quantity: item.quantity,
      hasCustomization: !!(item.customName || item.customNumber),
    })
  );

  const settings = await getStoreSettings();
  const totals = calculateTotals(lines, {
    shippingFlat: Number(settings.shippingFlat),
    freeShippingOver: Number(settings.freeShippingOver),
  });

  const orderNumber = generateOrderNumber();
  const isOnline = parsed.data.paymentMethod === "ONLINE";

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId: auth.user.id,
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        shippingAddress: parsed.data.address,
        city: parsed.data.city,
        country: parsed.data.country,
        postalCode: parsed.data.postalCode,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        shippingCost: totals.shipping,
        customizationTotal: totals.customizationTotal,
        total: totals.total,
        paymentMethod: parsed.data.paymentMethod,
        paymentStatus: isOnline ? "PAID" : "PENDING",
        orderStatus: isOnline ? "CONFIRMED" : "PENDING_PAYMENT",
        items: {
          create: cart.items.map((item, idx) => ({
            productId: item.productId,
            productName: item.product.name,
            productImage: item.product.images[0]?.url ?? null,
            unitPrice: lines[idx].unitPrice,
            size: item.size,
            quantity: item.quantity,
            customName: item.customName,
            customNumber: item.customNumber,
            customizationPrice: lines[idx].customizationPrice,
            discountApplied: lines[idx].discountPerUnit,
            lineTotal: lines[idx].lineTotal,
          })),
        },
      },
    });

    // Online orders are confirmed immediately, so stock is decremented now.
    if (isOnline) {
      for (const item of cart.items) {
        await tx.productVariant.update({
          where: { productId_size: { productId: item.productId, size: item.size } },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    await tx.cartItem.deleteMany({ where: { id: { in: cart.items.map((i) => i.id) } } });

    return created;
  });

  if (isOnline) {
    await notify({
      userId: auth.user.id,
      title: "Payment confirmed",
      message: `Your order #${order.orderNumber} has been confirmed.`,
      type: "PAYMENT_CONFIRMED",
      link: `/account/orders/${order.id}`,
    });
    await notifyAdmins({
      title: "New order",
      message: `Order #${order.orderNumber} — ${formatMoney(totals.total)} — paid online`,
      type: "NEW_ORDER",
      link: `/admin/orders/${order.id}`,
    });
  } else {
    await notify({
      userId: auth.user.id,
      title: "Order placed",
      message: `Order #${order.orderNumber} is awaiting Telegram payment.`,
      type: "ORDER_PLACED",
      link: `/account/orders/${order.id}`,
    });
    await notifyAdmins({
      title: "New Telegram payment request",
      message: `Order #${order.orderNumber} — ${formatMoney(totals.total)} — awaiting manual payment`,
      type: "TELEGRAM_PAYMENT_REQUEST",
      link: `/admin/orders/${order.id}`,
    });
  }

  revalidatePath("/account/orders");
  revalidatePath("/cart");

  return {
    success: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentMethod: parsed.data.paymentMethod,
  };
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
