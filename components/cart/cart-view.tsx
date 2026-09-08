"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Minus, Plus, Trash2, Bookmark, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { updateCartItemQuantity, removeCartItem, toggleSaveForLater } from "@/app/actions/cart-actions";
import type { PricedLine } from "@/lib/pricing";

type CartLine = PricedLine & {
  cartItemId: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  size: string;
  customName: string | null;
  customNumber: string | null;
  maxStock: number;
};

type SavedLine = { cartItemId: string; productId: string; slug: string; name: string; image: string; size: string; price: number };

type Totals = { subtotal: number; discountTotal: number; customizationTotal: number; shipping: number; total: number };

export function CartView({ lines, savedForLater, totals, freeShippingOver }: { lines: CartLine[]; savedForLater: SavedLine[]; totals: Totals; freeShippingOver: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function updateQty(cartItemId: string, qty: number) {
    startTransition(async () => {
      const res = await updateCartItemQuantity(cartItemId, qty);
      if (res?.error) toast.error(res.error);
      router.refresh();
    });
  }

  function remove(cartItemId: string) {
    startTransition(async () => {
      await removeCartItem(cartItemId);
      router.refresh();
    });
  }

  function saveForLater(cartItemId: string) {
    startTransition(async () => {
      await toggleSaveForLater(cartItemId);
      router.refresh();
    });
  }

  if (lines.length === 0 && savedForLater.length === 0) {
    return (
      <div className="container flex flex-col items-center justify-center py-24 text-center">
        <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground" />
        <h1 className="font-display text-3xl tracking-wide">Your cart is empty.</h1>
        <Button asChild className="mt-6">
          <Link href="/shop">Explore jerseys</Link>
        </Button>
      </div>
    );
  }

  const remaining = Math.max(0, freeShippingOver - (totals.subtotal - totals.discountTotal + totals.customizationTotal));

  return (
    <div className="container py-10">
      <h1 className="mb-8 font-display text-4xl tracking-wide">YOUR CART</h1>
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {lines.map((line) => (
            <div key={line.cartItemId} className="flex gap-4 rounded-xl border border-border p-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                <Image src={line.image} alt={line.name} fill className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between">
                  <div>
                    <Link href={`/shop/${line.slug}`} className="font-semibold hover:underline">{line.name}</Link>
                    <p className="text-sm text-muted-foreground">Size: {line.size}</p>
                    {(line.customName || line.customNumber) && (
                      <p className="text-sm text-muted-foreground">
                        Custom: {line.customName} #{line.customNumber}
                      </p>
                    )}
                  </div>
                  <p className="font-semibold">{formatPrice(line.lineTotal)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-md border border-border">
                    <button className="p-2" disabled={isPending} onClick={() => updateQty(line.cartItemId, line.quantity - 1)}><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-6 text-center text-sm">{line.quantity}</span>
                    <button className="p-2" disabled={isPending || line.quantity >= line.maxStock} onClick={() => updateQty(line.cartItemId, line.quantity + 1)}><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => saveForLater(line.cartItemId)}>
                      <Bookmark className="h-3.5 w-3.5" /> Save for later
                    </button>
                    <button className="flex items-center gap-1 text-xs text-destructive" onClick={() => remove(line.cartItemId)}>
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {savedForLater.length > 0 && (
            <div>
              <h2 className="mb-3 mt-8 font-semibold">Saved for Later ({savedForLater.length})</h2>
              <div className="space-y-3">
                {savedForLater.map((item) => (
                  <div key={item.cartItemId} className="flex items-center gap-4 rounded-xl border border-border p-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Size: {item.size} · {formatPrice(item.price)}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => saveForLater(item.cartItemId)}>Move to Cart</Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-fit rounded-xl border border-border p-6">
          <h2 className="mb-4 font-display text-xl tracking-wide">ORDER SUMMARY</h2>
          {remaining > 0 && totals.shipping > 0 && (
            <p className="mb-4 rounded-md bg-muted p-2 text-xs text-muted-foreground">
              Add {formatPrice(remaining)} more for free shipping
            </p>
          )}
          <div className="space-y-2 text-sm">
            <Row label="Subtotal" value={formatPrice(totals.subtotal)} />
            {totals.discountTotal > 0 && <Row label="Discount" value={`-${formatPrice(totals.discountTotal)}`} accent />}
            {totals.customizationTotal > 0 && <Row label="Customization" value={formatPrice(totals.customizationTotal)} />}
            <Row label="Shipping" value={totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)} />
          </div>
          <div className="my-4 border-t border-border" />
          <Row label="Total" value={formatPrice(totals.total)} bold />
          <Button size="lg" className="mt-6 w-full" disabled={lines.length === 0} asChild>
            <Link href="/checkout">Proceed to Checkout</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-lg font-bold" : ""} ${accent ? "text-accent" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
