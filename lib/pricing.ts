import { Discount, Product } from "@prisma/client";

export type ActiveDiscount = {
  id: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  label: string;
};

/**
 * Returns the currently-active discount for a product, or null.
 * A discount is active only if isActive=true AND now falls within
 * [startDate, endDate]. This is recomputed on every read rather than
 * relying on a cron to flip isActive, so an expired discount can never
 * silently keep applying.
 */
export function getActiveDiscount(discounts: Discount[], now: Date = new Date()): ActiveDiscount | null {
  const active = discounts.find(
    (d) => d.isActive && new Date(d.startDate) <= now && new Date(d.endDate) >= now
  );
  if (!active) return null;
  return {
    id: active.id,
    type: active.type,
    value: Number(active.value),
    label: active.label,
  };
}

/** Applies a discount to a base price. Never returns a negative price. */
export function applyDiscount(basePrice: number, discount: ActiveDiscount | null): number {
  if (!discount) return basePrice;
  const discounted =
    discount.type === "PERCENTAGE"
      ? basePrice * (1 - discount.value / 100)
      : basePrice - discount.value;
  return Math.max(0, Math.round(discounted * 100) / 100);
}

export function discountPercentLabel(basePrice: number, salePrice: number): string | null {
  if (salePrice >= basePrice) return null;
  const pct = Math.round(((basePrice - salePrice) / basePrice) * 100);
  return `${pct}% OFF`;
}

export type PriceableProduct = Pick<Product, "price" | "customizable" | "customizationPrice"> & {
  discounts: Discount[];
};

export type LineItemInput = {
  product: PriceableProduct;
  quantity: number;
  hasCustomization: boolean;
};

export type PricedLine = {
  unitPrice: number;
  originalUnitPrice: number;
  discountPerUnit: number;
  customizationPrice: number;
  quantity: number;
  lineTotal: number;
};

export function priceLineItem({ product, quantity, hasCustomization }: LineItemInput): PricedLine {
  const basePrice = Number(product.price);
  const activeDiscount = getActiveDiscount(product.discounts);
  const unitPrice = applyDiscount(basePrice, activeDiscount);
  const customizationPrice = hasCustomization && product.customizable ? Number(product.customizationPrice) : 0;

  return {
    unitPrice,
    originalUnitPrice: basePrice,
    discountPerUnit: Math.max(0, basePrice - unitPrice),
    customizationPrice,
    quantity,
    lineTotal: Math.round((unitPrice + customizationPrice) * quantity * 100) / 100,
  };
}

export type CartTotals = {
  subtotal: number;
  discountTotal: number;
  customizationTotal: number;
  shipping: number;
  total: number;
};

export function calculateTotals(
  lines: PricedLine[],
  opts: { shippingFlat: number; freeShippingOver: number }
): CartTotals {
  const subtotal = round(lines.reduce((sum, l) => sum + l.originalUnitPrice * l.quantity, 0));
  const discountTotal = round(lines.reduce((sum, l) => sum + l.discountPerUnit * l.quantity, 0));
  const customizationTotal = round(lines.reduce((sum, l) => sum + l.customizationPrice * l.quantity, 0));
  const merchandiseTotal = subtotal - discountTotal + customizationTotal;
  const shipping = merchandiseTotal >= opts.freeShippingOver ? 0 : opts.shippingFlat;
  const total = round(merchandiseTotal + shipping);

  return { subtotal, discountTotal, customizationTotal, shipping, total };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
