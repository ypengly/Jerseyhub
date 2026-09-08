import { MessageCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

export async function TelegramPayCta({ orderNumber, total }: { orderNumber: string; total: number }) {
  const settings = await db.storeSettings.findUnique({ where: { id: "singleton" } });
  const username = settings?.telegramUsername ?? "jerseyhub_store";

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-accent/30 bg-accent/5 p-5">
      <div>
        <p className="font-semibold">Awaiting Telegram payment</p>
        <p className="text-sm text-muted-foreground">
          Order #{orderNumber} — {formatPrice(total)}. Contact us to complete payment.
        </p>
      </div>
      <Button asChild>
        <a href={`https://t.me/${username}`} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="mr-2 h-4 w-4" /> CONTACT US ON TELEGRAM
        </a>
      </Button>
    </div>
  );
}
