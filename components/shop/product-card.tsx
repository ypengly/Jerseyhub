"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice, cn } from "@/lib/utils";
import type { ProductCardData } from "@/lib/serialize";
import { useState, useTransition } from "react";
import { toggleWishlist } from "@/app/actions/wishlist-actions";
import { addToCart } from "@/app/actions/cart-actions";
import { toast } from "sonner";

export function ProductCard({ product, initialWishlisted = false }: { product: ProductCardData; initialWishlisted?: boolean }) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [isPending, startTransition] = useTransition();

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted((w) => !w);
    startTransition(async () => {
      const res = await toggleWishlist(product.id);
      if (res?.error) {
        setWishlisted((w) => !w);
        toast.error(res.error);
      }
    });
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const res = await addToCart({ productId: product.id, size: "M", quantity: 1 });
      if (res?.error) toast.error(res.error);
      else toast.success(`${product.name} added to cart`);
    });
  }

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.discountPercent && (
          <Badge className="absolute left-3 top-3">{product.discountPercent}</Badge>
        )}
        {!product.inStock && (
          <Badge variant="muted" className="absolute right-3 top-3">Out of stock</Badge>
        )}
        <button
          onClick={handleWishlist}
          disabled={isPending}
          aria-label="Toggle wishlist"
          className="absolute right-3 top-3 rounded-full bg-background/80 p-2 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
        >
          <Heart className={cn("h-4 w-4", wishlisted && "fill-accent text-accent")} />
        </button>
        <button
          onClick={handleAddToCart}
          disabled={isPending || !product.inStock}
          className="absolute inset-x-3 bottom-3 translate-y-4 rounded-md bg-foreground py-2.5 text-sm font-semibold text-background opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 disabled:opacity-0"
        >
          Add to Cart
        </button>
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.team}</p>
        <h3 className="font-semibold leading-snug">{product.name}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
          {product.rating > 0 ? product.rating : "New"} {product.reviewCount > 0 && `(${product.reviewCount})`}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <span className="font-bold">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}