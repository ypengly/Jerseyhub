"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserApi } from "@/lib/authz";
import { cartItemSchema } from "@/lib/validations";

async function getOrCreateCart(userId: string) {
  const existing = await db.cart.findUnique({ where: { userId } });
  if (existing) return existing;
  return db.cart.create({ data: { userId } });
}

export async function addToCart(input: {
  productId: string;
  size: string;
  quantity: number;
  customName?: string | null;
  customNumber?: string | null;
}) {
  const auth = await requireUserApi();
  if ("error" in auth) return { error: auth.error };

  const parsed = cartItemSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const product = await db.product.findUnique({
    where: { id: parsed.data.productId },
    include: { variants: true },
  });
  if (!product || !product.isActive) return { error: "Product not found" };

  const variant = product.variants.find((v) => v.size === parsed.data.size);
  if (!variant || variant.stock < parsed.data.quantity) {
    return { error: "Not enough stock for this size" };
  }

  const cart = await getOrCreateCart(auth.user.id);

  const existingItem = await db.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId: parsed.data.productId,
      size: parsed.data.size,
      customName: parsed.data.customName ?? null,
      customNumber: parsed.data.customNumber ?? null,
      savedForLater: false,
    },
  });

  if (existingItem) {
    await db.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + parsed.data.quantity },
    });
  } else {
    await db.cartItem.create({
      data: {
        cartId: cart.id,
        productId: parsed.data.productId,
        size: parsed.data.size,
        quantity: parsed.data.quantity,
        customName: parsed.data.customName || null,
        customNumber: parsed.data.customNumber || null,
      },
    });
  }

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const auth = await requireUserApi();
  if ("error" in auth) return { error: auth.error };
  if (quantity < 1 || quantity > 10) return { error: "Invalid quantity" };

  const item = await db.cartItem.findUnique({ where: { id: cartItemId }, include: { cart: true, product: { include: { variants: true } } } });
  if (!item || item.cart.userId !== auth.user.id) return { error: "Not found" };

  const variant = item.product.variants.find((v) => v.size === item.size);
  if (!variant || variant.stock < quantity) return { error: "Not enough stock" };

  await db.cartItem.update({ where: { id: cartItemId }, data: { quantity } });
  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function removeCartItem(cartItemId: string) {
  const auth = await requireUserApi();
  if ("error" in auth) return { error: auth.error };

  const item = await db.cartItem.findUnique({ where: { id: cartItemId }, include: { cart: true } });
  if (!item || item.cart.userId !== auth.user.id) return { error: "Not found" };

  await db.cartItem.delete({ where: { id: cartItemId } });
  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function toggleSaveForLater(cartItemId: string) {
  const auth = await requireUserApi();
  if ("error" in auth) return { error: auth.error };

  const item = await db.cartItem.findUnique({ where: { id: cartItemId }, include: { cart: true } });
  if (!item || item.cart.userId !== auth.user.id) return { error: "Not found" };

  await db.cartItem.update({ where: { id: cartItemId }, data: { savedForLater: !item.savedForLater } });
  revalidatePath("/cart");
  return { success: true };
}
