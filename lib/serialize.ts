import { Product, ProductImage, Discount, Review, ProductVariant } from "@prisma/client";
import { getActiveDiscount, applyDiscount, discountPercentLabel } from "@/lib/pricing";

export type ProductWithRelations = Product & {
  images: ProductImage[];
  discounts: Discount[];
  reviews: Review[];
  variants: ProductVariant[];
};

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  team: string;
  sport: string;
  image: string;
  price: number;
  originalPrice: number | null;
  discountLabel: string | null;
  discountPercent: string | null;
  rating: number;
  reviewCount: number;
  inStock: boolean;
};

/** Converts a raw Product (with relations) into the flat shape product cards / grids need, with pricing resolved server-side. */
export function toProductCard(product: ProductWithRelations): ProductCardData {
  const basePrice = Number(product.price);
  const discount = getActiveDiscount(product.discounts);
  const salePrice = applyDiscount(basePrice, discount);
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : 0;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    team: product.team,
    sport: product.sport,
    image: product.images[0]?.url ?? "/placeholder-jersey.svg",
    price: salePrice,
    originalPrice: discount ? basePrice : null,
    discountLabel: discount?.label ?? null,
    discountPercent: discount ? discountPercentLabel(basePrice, salePrice) : null,
    rating: Math.round(avgRating * 10) / 10,
    reviewCount: product.reviews.length,
    inStock: totalStock > 0,
  };
}
