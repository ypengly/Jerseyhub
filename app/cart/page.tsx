import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { priceLineItem, calculateTotals } from "@/lib/pricing";
import { getStoreSettings } from "@/lib/queries";
import { CartView } from "@/components/cart/cart-view";

export default async function CartPage() {
  const user = await requireUser();

  const cart = await db.cart.findUnique({
    where: { userId: user.id },
    include: {
      items: {
        include: { product: { include: { images: { orderBy: { position: "asc" } }, discounts: true, variants: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const settings = await getStoreSettings();

  const activeItems = cart?.items.filter((i) => !i.savedForLater) ?? [];
  const savedItems = cart?.items.filter((i) => i.savedForLater) ?? [];

  const lines = activeItems.map((item) => {
    const priced = priceLineItem({
      product: item.product,
      quantity: item.quantity,
      hasCustomization: !!(item.customName || item.customNumber),
    });
    const variant = item.product.variants.find((v) => v.size === item.size);
    return {
      cartItemId: item.id,
      productId: item.product.id,
      slug: item.product.slug,
      name: item.product.name,
      image: item.product.images[0]?.url ?? "/placeholder-jersey.svg",
      size: item.size,
      customName: item.customName,
      customNumber: item.customNumber,
      maxStock: variant?.stock ?? 0,
      ...priced,
    };
  });

  const totals = calculateTotals(lines, {
    shippingFlat: Number(settings.shippingFlat),
    freeShippingOver: Number(settings.freeShippingOver),
  });

  const savedForLater = savedItems.map((item) => ({
    cartItemId: item.id,
    productId: item.product.id,
    slug: item.product.slug,
    name: item.product.name,
    image: item.product.images[0]?.url ?? "/placeholder-jersey.svg",
    size: item.size,
    price: Number(item.product.price),
  }));

  return <CartView lines={lines} savedForLater={savedForLater} totals={totals} freeShippingOver={Number(settings.freeShippingOver)} />;
}
