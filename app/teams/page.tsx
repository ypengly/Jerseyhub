import Link from "next/link";
import { db } from "@/lib/db";

export const metadata = { title: "Teams — JerseyHub" };

export default async function TeamsPage() {
  const teams = await db.product.groupBy({
    by: ["team", "sport"],
    _count: true,
    where: { isActive: true },
    orderBy: { team: "asc" },
  });

  return (
    <div className="container py-10">
      <h1 className="mb-2 font-display text-4xl tracking-wide">TEAMS</h1>
      <p className="mb-8 text-muted-foreground">Shop jerseys by club or national team.</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {teams.map((t) => (
          <Link
            key={t.team}
            href={`/shop?team=${encodeURIComponent(t.team)}`}
            className="group flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card p-8 text-center transition hover:border-accent"
          >
            <p className="font-display text-xl tracking-wide group-hover:text-accent">{t.team}</p>
            <p className="text-xs uppercase text-muted-foreground">{t.sport}</p>
            <p className="text-xs text-muted-foreground">{t._count} jerseys</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
