import { db } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { WishlistView } from "@/components/account/wishlist-view";
import { toProductCard } from "@/lib/serialize";

export default async function WishlistPage() {
  const user = await requireUser();

  const wishlist = await db.wishlist.findUnique({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          product: {
            include: { images: { orderBy: { position: "asc" } }, discounts: true, reviews: true, variants: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const items = (wishlist?.items ?? []).map((item) => ({
    ...toProductCard(item.product),
    sizes: item.product.variants.filter((v) => v.stock > 0).map((v) => v.size),
  }));

  return <WishlistView items={items} />;
}
