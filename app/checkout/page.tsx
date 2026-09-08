import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { priceLineItem, calculateTotals } from "@/lib/pricing";
import { getStoreSettings } from "@/lib/queries";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";

export default async function CheckoutPage() {
  const user = await requireUser();

  const [cart, fullUser, defaultAddress, settings] = await Promise.all([
    db.cart.findUnique({
      where: { userId: user.id },
      include: { items: { where: { savedForLater: false }, include: { product: { include: { discounts: true } } } } },
    }),
    db.user.findUnique({ where: { id: user.id } }),
    db.address.findFirst({ where: { userId: user.id, isDefault: true } }),
    getStoreSettings(),
  ]);

  if (!cart || cart.items.length === 0) redirect("/cart");

  const lines = cart.items.map((item) =>
    priceLineItem({ product: item.product, quantity: item.quantity, hasCustomization: !!(item.customName || item.customNumber) })
  );
  const totals = calculateTotals(lines, { shippingFlat: Number(settings.shippingFlat), freeShippingOver: Number(settings.freeShippingOver) });

  return (
    <CheckoutFlow
      totals={totals}
      itemCount={cart.items.reduce((s, i) => s + i.quantity, 0)}
      telegramUsername={settings.telegramUsername}
      defaults={{
        fullName: fullUser?.name ?? "",
        email: fullUser?.email ?? "",
        phone: fullUser?.phone ?? "",
        address: defaultAddress?.address ?? "",
        city: defaultAddress?.city ?? "",
        country: defaultAddress?.country ?? "",
        postalCode: defaultAddress?.postalCode ?? "",
      }}
    />
  );
}
