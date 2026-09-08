"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateOrderStatus, updatePaymentStatus, markOrderPaid } from "@/app/actions/admin/order-actions";
import { toast } from "sonner";
import { OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";
import { MessageCircle } from "lucide-react";

const ORDER_STATUSES: OrderStatus[] = ["PENDING_PAYMENT", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "PAID", "FAILED", "REFUNDED"];

export function OrderStatusControls({
  orderId,
  currentPaymentStatus,
  currentOrderStatus,
  paymentMethod,
}: {
  orderId: string;
  currentPaymentStatus: PaymentStatus;
  currentOrderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleOrderStatus(value: string) {
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, value as OrderStatus);
      if (res?.error) toast.error(res.error);
      else toast.success("Order status updated");
      router.refresh();
    });
  }

  function handlePaymentStatus(value: string) {
    startTransition(async () => {
      const res = await updatePaymentStatus(orderId, value as PaymentStatus);
      if (res?.error) toast.error(res.error);
      else toast.success("Payment status updated");
      router.refresh();
    });
  }

  function handleMarkPaid() {
    startTransition(async () => {
      const res = await markOrderPaid(orderId);
      if (res?.error) toast.error(res.error);
      else toast.success("Marked as paid — inventory updated");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border p-5">
      {paymentMethod === "TELEGRAM" && currentPaymentStatus === "PENDING" && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-accent/10 p-3">
          <span className="flex items-center gap-2 text-sm font-medium"><MessageCircle className="h-4 w-4" /> Awaiting Telegram payment confirmation</span>
          <Button size="sm" onClick={handleMarkPaid} disabled={isPending}>Mark as Paid</Button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Payment Status</Label>
          <Select value={currentPaymentStatus} onValueChange={handlePaymentStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Order Status</Label>
          <Select value={currentOrderStatus} onValueChange={handleOrderStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
