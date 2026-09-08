import { OrderStatus, PaymentStatus } from "@prisma/client";

type BadgeVariant = "default" | "outline" | "muted" | "success" | "destructive";

export const ORDER_STATUS_STYLES: Record<OrderStatus, { label: string; variant: BadgeVariant }> = {
  PENDING_PAYMENT: { label: "Pending Payment", variant: "muted" },
  CONFIRMED: { label: "Confirmed", variant: "default" },
  PROCESSING: { label: "Processing", variant: "outline" },
  SHIPPED: { label: "Shipped", variant: "outline" },
  DELIVERED: { label: "Delivered", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export const PAYMENT_STATUS_STYLES: Record<PaymentStatus, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "Pending", variant: "muted" },
  PAID: { label: "Paid", variant: "success" },
  FAILED: { label: "Failed", variant: "destructive" },
  REFUNDED: { label: "Refunded", variant: "outline" },
};

// Ordered timeline used on the order detail page. CANCELLED is handled
// separately since it can happen at any point and isn't part of the
// linear happy path.
export const STATUS_TIMELINE: OrderStatus[] = ["PENDING_PAYMENT", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export const STATUS_TIMELINE_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Order placed",
  CONFIRMED: "Payment confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};
