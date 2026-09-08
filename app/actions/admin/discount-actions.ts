"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/authz";
import { discountSchema } from "@/lib/validations";
import { notify } from "@/lib/notifications";
import { z } from "zod";

type DiscountInput = z.infer<typeof discountSchema>;

export async function createDiscount(input: DiscountInput) {
  const auth = await requireAdminApi();
  if ("error" in auth) return { error: auth.error };

  const parsed = discountSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid discount" };

  const discount = await db.discount.create({ data: { ...parsed.data, isActive: parsed.data.isActive ?? true } });

  // Notify wishlisters that a discount just started (if it's active as of now).
  const now = new Date();
  if (discount.isActive && discount.startDate <= now && discount.endDate >= now) {
    const product = await db.product.findUnique({ where: { id: discount.productId } });
    const wishlisters = await db.wishlistItem.findMany({ where: { productId: discount.productId }, include: { wishlist: true } });
    for (const w of wishlisters) {
      await notify({
        userId: w.wishlist.userId,
        title: "Discount started",
        message: `${product?.name ?? "A jersey on your wishlist"} is now ${discount.label}.`,
        type: "DISCOUNT_STARTED",
        link: product ? `/shop/${product.slug}` : undefined,
      });
    }
  }

  revalidatePath("/admin/discounts");
  revalidatePath("/shop");
  return { success: true };
}

export async function updateDiscount(discountId: string, input: DiscountInput) {
  const auth = await requireAdminApi();
  if ("error" in auth) return { error: auth.error };

  const parsed = discountSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid discount" };

  await db.discount.update({ where: { id: discountId }, data: { ...parsed.data, isActive: parsed.data.isActive ?? true } });

  revalidatePath("/admin/discounts");
  revalidatePath("/shop");
  return { success: true };
}

export async function toggleDiscountActive(discountId: string, isActive: boolean) {
  const auth = await requireAdminApi();
  if ("error" in auth) return { error: auth.error };

  await db.discount.update({ where: { id: discountId }, data: { isActive } });
  revalidatePath("/admin/discounts");
  revalidatePath("/shop");
  return { success: true };
}

export async function deleteDiscount(discountId: string) {
  const auth = await requireAdminApi();
  if ("error" in auth) return { error: auth.error };

  await db.discount.delete({ where: { id: discountId } });
  revalidatePath("/admin/discounts");
  revalidatePath("/shop");
  return { success: true };
}
