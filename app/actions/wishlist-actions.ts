"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserApi } from "@/lib/authz";

async function getOrCreateWishlist(userId: string) {
  const existing = await db.wishlist.findUnique({ where: { userId } });
  if (existing) return existing;
  return db.wishlist.create({ data: { userId } });
}

export async function toggleWishlist(productId: string) {
  const auth = await requireUserApi();
  if ("error" in auth) return { error: auth.error };

  const wishlist = await getOrCreateWishlist(auth.user.id);
  const existing = await db.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
  });

  if (existing) {
    await db.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    await db.wishlistItem.create({ data: { wishlistId: wishlist.id, productId } });
  }

  revalidatePath("/account/wishlist");
  return { success: true, wishlisted: !existing };
}

export async function moveWishlistItemToCart(productId: string, size: string) {
  const auth = await requireUserApi();
  if ("error" in auth) return { error: auth.error };

  const [wishlist, cart, variant] = await Promise.all([
    getOrCreateWishlist(auth.user.id),
    db.cart.upsert({ where: { userId: auth.user.id }, create: { userId: auth.user.id }, update: {} }),
    db.productVariant.findFirst({ where: { productId, size } }),
  ]);

  if (!variant || variant.stock < 1) return { error: "Out of stock" };

  await db.$transaction([
    db.cartItem.create({ data: { cartId: cart.id, productId, size, quantity: 1 } }),
    db.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id, productId } }),
  ]);

  revalidatePath("/account/wishlist");
  revalidatePath("/cart");
  return { success: true };
}
