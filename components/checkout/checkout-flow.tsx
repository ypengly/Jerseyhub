"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice, cn } from "@/lib/utils";
import { createOrder } from "@/app/actions/order-actions";
import { toast } from "sonner";

type Totals = { subtotal: number; discountTotal: number; customizationTotal: number; shipping: number; total: number };

type Defaults = { fullName: string; email: string; phone: string; address: string; city: string; country: string; postalCode: string };

const STEPS = ["Customer Info", "Shipping", "Payment"] as const;

export function CheckoutFlow({ totals, itemCount, telegramUsername, defaults }: { totals: Totals; itemCount: number; telegramUsername: string; defaults: Defaults }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(defaults);
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "TELEGRAM" | null>(null);
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ orderId: string; orderNumber: string; paymentMethod: "ONLINE" | "TELEGRAM" } | null>(null);

  function update<K extends keyof Defaults>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function canProceedStep0() {
    return form.fullName.trim().length > 1 && /\S+@\S+\.\S+/.test(form.email) && form.phone.trim().length > 5;
  }
  function canProceedStep1() {
    return form.address.trim().length > 3 && form.city.trim().length > 1 && form.country.trim().length > 1 && form.postalCode.trim().length > 1;
  }

  async function handlePay() {
    if (paymentMethod === "ONLINE") {
      // Sandbox validation only — no real payment is ever processed.
      const digits = card.number.replace(/\s/g, "");
      if (digits !== "4242424242424242") {
        toast.error("Use the test card number 4242 4242 4242 4242");
        return;
      }
      if (card.expiry.trim().length < 4 || card.cvc.trim().length < 3) {
        toast.error("Enter a test expiry and CVC");
        return;
      }
    }
    if (!paymentMethod) return;

    setSubmitting(true);
    const res = await createOrder({ ...form, paymentMethod });
    setSubmitting(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }
    setResult({ orderId: res.orderId!, orderNumber: res.orderNumber!, paymentMethod: res.paymentMethod! });
  }

  if (result) {
    return <OrderConfirmation result={result} total={totals.total} telegramUsername={telegramUsername} />;
  }

  return (
    <div className="container py-10">
      <h1 className="mb-8 font-display text-4xl tracking-wide">CHECKOUT</h1>

      <div className="mb-10 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold", i <= step ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>
              {i + 1}
            </div>
            <span className={cn("hidden text-sm font-semibold sm:block", i === step ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-border p-6">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl tracking-wide">CUSTOMER INFORMATION</h2>
              <Field label="Full Name" value={form.fullName} onChange={(v) => update("fullName", v)} />
              <Field label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} />
              <Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} />
              <Button className="w-full" disabled={!canProceedStep0()} onClick={() => setStep(1)}>Continue to Shipping</Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl tracking-wide">SHIPPING ADDRESS</h2>
              <Field label="Address" value={form.address} onChange={(v) => update("address", v)} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="City" value={form.city} onChange={(v) => update("city", v)} />
                <Field label="Postal Code" value={form.postalCode} onChange={(v) => update("postalCode", v)} />
              </div>
              <Field label="Country" value={form.country} onChange={(v) => update("country", v)} />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>Back</Button>
                <Button className="flex-1" disabled={!canProceedStep1()} onClick={() => setStep(2)}>Continue to Payment</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl tracking-wide">PAYMENT</h2>

              <div className="grid gap-3 sm:grid-cols-2">
                <PaymentOption
                  active={paymentMethod === "ONLINE"}
                  icon={<CreditCard className="h-5 w-5" />}
                  title="Pay Online"
                  description="Sandbox test payment — no real charge"
                  onClick={() => setPaymentMethod("ONLINE")}
                />
                <PaymentOption
                  active={paymentMethod === "TELEGRAM"}
                  icon={<MessageCircle className="h-5 w-5" />}
                  title="Pay via Telegram"
                  description="Contact us to complete payment manually"
                  onClick={() => setPaymentMethod("TELEGRAM")}
                />
              </div>

              {paymentMethod === "ONLINE" && (
                <div className="space-y-3 rounded-lg bg-muted p-4">
                  <p className="text-xs text-muted-foreground">Sandbox mode — use test card <strong>4242 4242 4242 4242</strong>, any future expiry, any CVC.</p>
                  <Field label="Card Number" value={card.number} onChange={(v) => setCard((c) => ({ ...c, number: v }))} placeholder="4242 4242 4242 4242" />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Expiry (MM/YY)" value={card.expiry} onChange={(v) => setCard((c) => ({ ...c, expiry: v }))} placeholder="12/28" />
                    <Field label="CVC" value={card.cvc} onChange={(v) => setCard((c) => ({ ...c, cvc: v }))} placeholder="123" />
                  </div>
                </div>
              )}

              {paymentMethod === "TELEGRAM" && (
                <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                  We'll place your order as pending, then show you a Telegram link to complete payment directly with our team.
                </p>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1" disabled={!paymentMethod || submitting} onClick={handlePay}>
                  {submitting ? "Processing..." : paymentMethod === "ONLINE" ? "PAY NOW" : "Place Order"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="h-fit rounded-xl border border-border p-6">
          <h2 className="mb-4 font-display text-xl tracking-wide">ORDER SUMMARY</h2>
          <p className="mb-4 text-sm text-muted-foreground">{itemCount} item(s)</p>
          <div className="space-y-2 text-sm">
            <Row label="Subtotal" value={formatPrice(totals.subtotal)} />
            {totals.discountTotal > 0 && <Row label="Discount" value={`-${formatPrice(totals.discountTotal)}`} />}
            {totals.customizationTotal > 0 && <Row label="Customization" value={formatPrice(totals.customizationTotal)} />}
            <Row label="Shipping" value={totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)} />
          </div>
          <div className="my-4 border-t border-border" />
          <Row label="Total" value={formatPrice(totals.total)} bold />
        </div>
      </div>
    </div>
  );
}

function OrderConfirmation({ result, total, telegramUsername }: { result: { orderId: string; orderNumber: string; paymentMethod: "ONLINE" | "TELEGRAM" }; total: number; telegramUsername: string }) {
  return (
    <div className="container flex flex-col items-center justify-center py-24 text-center">
      <CheckCircle2 className="mb-4 h-16 w-16 text-success" />
      {result.paymentMethod === "ONLINE" ? (
        <>
          <h1 className="font-display text-3xl tracking-wide">Payment successful!</h1>
          <p className="mt-2 text-muted-foreground">Your order #{result.orderNumber} has been confirmed.</p>
        </>
      ) : (
        <>
          <h1 className="font-display text-3xl tracking-wide">Order placed — payment pending</h1>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            To complete your order, contact our store through Telegram.
          </p>
          <div className="mt-6 w-full max-w-sm rounded-lg border border-border p-5 text-left">
            <Row label="Order number" value={`#${result.orderNumber}`} />
            <Row label="Order total" value={formatPrice(total)} />
          </div>
          <Button size="lg" className="mt-6" asChild>
            <a href={`https://t.me/${telegramUsername}`} target="_blank" rel="noopener noreferrer">
              CONTACT US ON TELEGRAM
            </a>
          </Button>
        </>
      )}
      <div className="mt-8 flex gap-3">
        <Button variant="outline" asChild>
          <Link href={`/account/orders/${result.orderId}`}>View Order</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}

function PaymentOption({ active, icon, title, description, onClick }: { active: boolean; icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition", active ? "border-accent bg-accent/5" : "border-border hover:border-accent/50")}>
      {icon}
      <span className="font-semibold">{title}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </button>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn("flex justify-between", bold && "text-lg font-bold")}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
