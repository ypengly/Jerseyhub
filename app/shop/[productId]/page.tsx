import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getActiveDiscount, applyDiscount, discountPercentLabel } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/authz";
import { getWishlistedProductIds } from "@/lib/queries";
import { ProductDetailClient } from "@/components/shop/product-detail-client";
import { ReviewSection } from "@/components/shop/review-section";
import { ProductCard } from "@/components/shop/product-card";
import { toProductCard } from "@/lib/serialize";

export default async function ProductDetailPage({ params }: { params: { productId: string } }) {
  const product = await db.product.findFirst({
    where: { OR: [{ slug: params.productId }, { id: params.productId }], isActive: true },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: true,
      discounts: true,
      reviews: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!product) notFound();

  const user = await getCurrentUser();
  const [wishlisted, canReview, related] = await Promise.all([
    getWishlistedProductIds(),
    user
      ? db.orderItem.findFirst({
          where: { productId: product.id, order: { userId: user.id, paymentStatus: "PAID" } },
        })
      : null,
    db.product.findMany({
      where: { team: product.team, id: { not: product.id }, isActive: true },
      include: { images: { orderBy: { position: "asc" } }, discounts: true, reviews: true, variants: true },
      take: 4,
    }),
  ]);

  const basePrice = Number(product.price);
  const discount = getActiveDiscount(product.discounts);
  const salePrice = applyDiscount(basePrice, discount);
  const discountPercent = discount ? discountPercentLabel(basePrice, salePrice) : null;
  const avgRating =
    product.reviews.length > 0 ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length : 0;

  return (
    <div className="container py-10">
      <ProductDetailClient
        product={{
          id: product.id,
          name: product.name,
          team: product.team,
          season: product.season,
          description: product.description,
          images: product.images.map((i) => i.url),
          price: salePrice,
          originalPrice: discount ? basePrice : null,
          discountLabel: discount?.label ?? null,
          discountPercent,
          customizable: product.customizable,
          customizationPrice: Number(product.customizationPrice),
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: product.reviews.length,
          variants: product.variants.map((v) => ({ size: v.size, stock: v.stock })),
        }}
        initialWishlisted={wishlisted.has(product.id)}
      />

      <ReviewSection productId={product.id} reviews={product.reviews} canReview={!!canReview} />

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 font-display text-3xl tracking-wide">MORE FROM {product.team.toUpperCase()}</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {related.map((p) => {
              const card = toProductCard(p);
              return <ProductCard key={card.id} product={card} initialWishlisted={wishlisted.has(card.id)} />;
            })}
          </div>
        </section>
      )}
    </div>
  );
}
