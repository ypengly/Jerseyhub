"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Heart, Star, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatPrice } from "@/lib/utils";
import { JerseyPreview } from "./jersey-preview";
import { addToCart } from "@/app/actions/cart-actions";
import { toggleWishlist } from "@/app/actions/wishlist-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Variant = { size: string; stock: number };

type ProductDetail = {
  id: string;
  name: string;
  team: string;
  season: string;
  description: string;
  images: string[];
  price: number;
  originalPrice: number | null;
  discountLabel: string | null;
  discountPercent: string | null;
  customizable: boolean;
  customizationPrice: number;
  rating: number;
  reviewCount: number;
  variants: Variant[];
};

const SIZE_ORDER = ["S", "M", "L", "XL", "XXL"];

export function ProductDetailClient({ product, initialWishlisted }: { product: ProductDetail; initialWishlisted: boolean }) {
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customize, setCustomize] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [isPending, startTransition] = useTransition();

  const sortedVariants = useMemo(
    () => [...product.variants].sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)),
    [product.variants]
  );
  const selectedVariant = sortedVariants.find((v) => v.size === size);
  const customizationCost = customize ? product.customizationPrice : 0;
  const total = (product.price + customizationCost) * quantity;

  function handleWishlist() {
    setWishlisted((w) => !w);
    startTransition(async () => {
      const res = await toggleWishlist(product.id);
      if (res?.error) {
        setWishlisted((w) => !w);
        toast.error(res.error);
      }
    });
  }

  function handleAddToCart() {
    if (!size) {
      toast.error("Please select a size");
      return;
    }
    if (customize && (!customName.trim() || !customNumber.trim())) {
      toast.error("Enter both a name and number, or turn off customization");
      return;
    }
    startTransition(async () => {
      const res = await addToCart({
        productId: product.id,
        size,
        quantity,
        customName: customize ? customName.trim().toUpperCase() : null,
        customNumber: customize ? customNumber.trim() : null,
      });
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Added to cart");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      {/* GALLERY / PREVIEW */}
      <div>
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          <Image src={product.images[activeImage] ?? "/placeholder-jersey.svg"} alt={product.name} fill className="object-cover" priority />
          {customize && (customName || customNumber) && (
            <JerseyPreview name={customName} number={customNumber} />
          )}
        </div>
        {product.images.length > 1 && (
          <div className="mt-3 flex gap-2">
            {product.images.map((img, i) => (
              <button
                key={img + i}
                onClick={() => setActiveImage(i)}
                className={cn("relative h-20 w-20 overflow-hidden rounded-md border-2", i === activeImage ? "border-accent" : "border-transparent")}
              >
                <Image src={img} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* DETAILS */}
      <div>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">{product.team} · {product.season}</p>
        <h1 className="mt-1 font-display text-4xl tracking-wide">{product.name}</h1>

        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="h-4 w-4 fill-accent text-accent" />
          {product.rating > 0 ? product.rating : "No ratings yet"} {product.reviewCount > 0 && `(${product.reviewCount} reviews)`}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
          {product.originalPrice && <span className="text-lg text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>}
          {product.discountPercent && <Badge>{product.discountPercent}</Badge>}
          {product.discountLabel && <Badge variant="outline">{product.discountLabel}</Badge>}
        </div>

        <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>

        {/* SIZE */}
        <div className="mt-8">
          <Label className="mb-2 block font-semibold">Size</Label>
          <div className="flex flex-wrap gap-2">
            {sortedVariants.map((v) => (
              <button
                key={v.size}
                disabled={v.stock === 0}
                onClick={() => setSize(v.size)}
                className={cn(
                  "h-11 w-14 rounded-md border text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-30",
                  size === v.size ? "border-accent bg-accent text-accent-foreground" : "border-border hover:border-accent"
                )}
              >
                {v.size}
              </button>
            ))}
          </div>
          {selectedVariant && (
            <p className="mt-2 text-xs text-muted-foreground">
              {selectedVariant.stock === 0 ? "Out of stock" : selectedVariant.stock <= 5 ? `Only ${selectedVariant.stock} left` : "In stock"}
            </p>
          )}
        </div>

        {/* CUSTOMIZATION */}
        {product.customizable && (
          <div className="mt-8 rounded-xl border border-border p-5">
            <label className="flex items-center justify-between">
              <span className="font-semibold">Customize Jersey</span>
              <input type="checkbox" checked={customize} onChange={(e) => setCustomize(e.target.checked)} className="h-5 w-5 accent-accent" />
            </label>
            {customize && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block text-xs">Name</Label>
                  <Input maxLength={12} value={customName} onChange={(e) => setCustomName(e.target.value.toUpperCase())} placeholder="MESSI" />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs">Number</Label>
                  <Input maxLength={2} value={customNumber} onChange={(e) => setCustomNumber(e.target.value.replace(/\D/g, ""))} placeholder="10" />
                </div>
                <p className="col-span-2 text-xs text-muted-foreground">+ {formatPrice(product.customizationPrice)} customization fee</p>
              </div>
            )}
          </div>
        )}

        {/* QUANTITY */}
        <div className="mt-6 flex items-center gap-4">
          <Label className="font-semibold">Quantity</Label>
          <div className="flex items-center rounded-md border border-border">
            <button className="p-3" onClick={() => setQuantity((q) => Math.max(1, q - 1))}><Minus className="h-4 w-4" /></button>
            <span className="w-8 text-center">{quantity}</span>
            <button className="p-3" onClick={() => setQuantity((q) => Math.min(10, q + 1))}><Plus className="h-4 w-4" /></button>
          </div>
        </div>

        {/* TOTAL + ACTIONS */}
        <div className="mt-6 flex items-center justify-between rounded-lg bg-muted p-4">
          <span className="font-semibold">Total</span>
          <span className="text-xl font-bold">{formatPrice(total)}</span>
        </div>

        <div className="mt-4 flex gap-3">
          <Button size="lg" className="flex-1" disabled={isPending || sortedVariants.every((v) => v.stock === 0)} onClick={handleAddToCart}>
            {sortedVariants.every((v) => v.stock === 0) ? "Out of Stock" : "Add to Cart"}
          </Button>
          <Button size="lg" variant="outline" onClick={handleWishlist} aria-label="Toggle wishlist">
            <Heart className={cn("h-5 w-5", wishlisted && "fill-accent text-accent")} />
          </Button>
        </div>
      </div>
    </div>
  );
}
