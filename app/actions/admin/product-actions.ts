"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/authz";
import { productSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { notify } from "@/lib/notifications";
import { z } from "zod";

type ProductInput = z.infer<typeof productSchema>;

export async function createProduct(input: ProductInput) {
  const auth = await requireAdminApi();
  if ("error" in auth) return { error: auth.error };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid product data" };

  const baseSlug = slugify(parsed.data.name);
  let slug = baseSlug;
  let suffix = 1;
  while (await db.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const product = await db.product.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      sport: parsed.data.sport,
      team: parsed.data.team,
      season: parsed.data.season,
      category: parsed.data.category,
      price: parsed.data.price,
      customizable: parsed.data.customizable,
      customizationPrice: parsed.data.customizationPrice,
      featured: parsed.data.featured ?? false,
      isActive: parsed.data.isActive ?? true,
      images: { create: parsed.data.images.map((img, i) => ({ url: img.url, altText: img.altText, position: i })) },
      variants: { create: parsed.data.sizes.map((s) => ({ size: s.size, stock: s.stock })) },
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { success: true, productId: product.id };
}

export async function updateProduct(productId: string, input: ProductInput) {
  const auth = await requireAdminApi();
  if ("error" in auth) return { error: auth.error };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid product data" };

  await db.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        sport: parsed.data.sport,
        team: parsed.data.team,
        season: parsed.data.season,
        category: parsed.data.category,
        price: parsed.data.price,
        customizable: parsed.data.customizable,
        customizationPrice: parsed.data.customizationPrice,
        featured: parsed.data.featured ?? false,
        isActive: parsed.data.isActive ?? true,
      },
    });

    // Replace images wholesale — simplest correct approach for a demo admin form.
    await tx.productImage.deleteMany({ where: { productId } });
    await tx.productImage.createMany({
      data: parsed.data.images.map((img, i) => ({ productId, url: img.url, altText: img.altText, position: i })),
    });

    // Upsert variants by size so existing stock isn't clobbered if the size list is unchanged.
    for (const s of parsed.data.sizes) {
      await tx.productVariant.upsert({
        where: { productId_size: { productId, size: s.size } },
        create: { productId, size: s.size, stock: s.stock },
        update: { stock: s.stock },
      });
    }
    const keepSizes = parsed.data.sizes.map((s) => s.size);
    await tx.productVariant.deleteMany({ where: { productId, size: { notIn: keepSizes } } });
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/shop");
  return { success: true };
}

export async function deleteProduct(productId: string) {
  const auth = await requireAdminApi();
  if ("error" in auth) return { error: auth.error };

  await db.product.delete({ where: { id: productId } });
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { success: true };
}

export async function updateVariantStock(variantId: string, stock: number) {
  const auth = await requireAdminApi();
  if ("error" in auth) return { error: auth.error };
  if (stock < 0) return { error: "Stock cannot be negative" };

  const variant = await db.productVariant.findUnique({ where: { id: variantId }, include: { product: true } });
  if (!variant) return { error: "Not found" };

  const wasOutOfStock = variant.stock === 0;
  await db.productVariant.update({ where: { id: variantId }, data: { stock } });

  // Notify wishlisted customers when a previously out-of-stock size comes back.
  if (wasOutOfStock && stock > 0) {
    const wishlisters = await db.wishlistItem.findMany({
      where: { productId: variant.productId },
      include: { wishlist: true },
    });
    for (const w of wishlisters) {
      await notify({
        userId: w.wishlist.userId,
        title: "Product back in stock",
        message: `${variant.product.name} (size ${variant.size}) is back in stock.`,
        type: "BACK_IN_STOCK",
        link: `/shop/${variant.product.slug}`,
      });
    }
  }

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  return { success: true };
}
