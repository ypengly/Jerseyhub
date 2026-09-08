"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserApi } from "@/lib/authz";
import { reviewSchema } from "@/lib/validations";
import { notifyAdmins } from "@/lib/notifications";

export async function submitReview(input: { productId: string; rating: number; comment: string; imageUrl?: string | null }) {
  const auth = await requireUserApi();
  if ("error" in auth) return { error: auth.error };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  // Only customers who purchased (and paid for) the product may review it.
  const purchased = await db.orderItem.findFirst({
    where: { productId: parsed.data.productId, order: { userId: auth.user.id, paymentStatus: "PAID" } },
  });
  if (!purchased) return { error: "You can only review products you've purchased" };

  const existing = await db.review.findUnique({
    where: { productId_userId: { productId: parsed.data.productId, userId: auth.user.id } },
  });
  if (existing) return { error: "You've already reviewed this product" };

  const product = await db.product.findUnique({ where: { id: parsed.data.productId } });

  await db.review.create({
    data: {
      productId: parsed.data.productId,
      userId: auth.user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      imageUrl: parsed.data.imageUrl || null,
    },
  });

  await notifyAdmins({
    title: "New review",
    message: `${auth.user.name} left a ${parsed.data.rating}-star review on ${product?.name ?? "a product"}`,
    type: "NEW_REVIEW",
    link: "/admin/reviews",
  });

  revalidatePath(`/shop/${product?.slug}`);
  return { success: true };
}
