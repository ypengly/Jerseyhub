"use client";

import Link from "next/link";
import Image from "next/image";
import { useTransition } from "react";
import { Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { toggleWishlist, moveWishlistItemToCart } from "@/app/actions/wishlist-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { ProductCardData } from "@/lib/serialize";

type WishlistItem = ProductCardData & { sizes: string[] };

export function WishlistView({ items }: { items: WishlistItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function remove(productId: string) {
    startTransition(async () => {
      await toggleWishlist(productId);
      router.refresh();
    });
  }

  function moveToCart(productId: string, size: string) {
    startTransition(async () => {
      const res = await moveWishlistItemToCart(productId, size);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Moved to cart");
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <div className="container flex flex-col items-center justify-center py-24 text-center">
        <Heart className="mb-4 h-16 w-16 text-muted-foreground" />
        <h1 className="font-display text-3xl tracking-wide">Your wishlist is waiting for your next favorite jersey.</h1>
        <Button asChild className="mt-6"><Link href="/shop">Explore jerseys</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="mb-8 font-display text-4xl tracking-wide">WISHLIST</h1>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-border p-3">
            <Link href={`/shop/${item.slug}`} className="relative block aspect-square overflow-hidden rounded-lg bg-muted">
              <Image src={item.image} alt={item.name} fill className="object-cover" />
              {item.discountPercent && <Badge className="absolute left-2 top-2">{item.discountPercent}</Badge>}
            </Link>
            <div className="mt-3">
              <Link href={`/shop/${item.slug}`} className="font-semibold hover:underline">{item.name}</Link>
              <p className="text-sm font-bold">{formatPrice(item.price)}</p>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                disabled={isPending || item.sizes.length === 0}
                onClick={() => moveToCart(item.id, item.sizes[0])}
              >
                {item.sizes.length === 0 ? "Out of Stock" : "Move to Cart"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => remove(item.id)} aria-label="Remove">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
