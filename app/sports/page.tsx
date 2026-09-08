import Link from "next/link";
import { db } from "@/lib/db";

export const metadata = { title: "Sports — JerseyHub" };

const SPORT_LABELS: Record<string, string> = { FOOTBALL: "Football", BASKETBALL: "Basketball", OTHER: "Other Sports" };

export default async function SportsPage() {
  const sports = await db.product.groupBy({ by: ["sport"], _count: true, where: { isActive: true } });

  return (
    <div className="container py-10">
      <h1 className="mb-2 font-display text-4xl tracking-wide">SPORTS</h1>
      <p className="mb-8 text-muted-foreground">Browse jerseys by sport.</p>
      <div className="grid gap-6 sm:grid-cols-3">
        {sports.map((s) => (
          <Link
            key={s.sport}
            href={`/shop?sport=${s.sport}`}
            className="flex h-52 flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-muted to-card text-center transition hover:from-accent/20"
          >
            <p className="font-display text-3xl tracking-wide">{SPORT_LABELS[s.sport] ?? s.sport}</p>
            <p className="text-sm text-muted-foreground">{s._count} jerseys</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
