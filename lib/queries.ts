import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/authz";

/** Returns the current user's wishlisted product IDs as a Set, or an empty Set if logged out. Used to pre-fill wishlist heart state on product cards without a client-side fetch per card. */
export async function getWishlistedProductIds(): Promise<Set<string>> {
  const user = await getCurrentUser();
  if (!user) return new Set();
  const wishlist = await db.wishlist.findUnique({
    where: { userId: user.id },
    include: { items: { select: { productId: true } } },
  });
  return new Set(wishlist?.items.map((i) => i.productId) ?? []);
}

export async function getStoreSettings() {
  const settings = await db.storeSettings.findUnique({ where: { id: "singleton" } });
  if (settings) return settings;
  return db.storeSettings.create({ data: { id: "singleton" } });
}
