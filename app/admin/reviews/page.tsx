import { db } from "@/lib/db";
import { formatDate, cn } from "@/lib/utils";
import { Star } from "lucide-react";

export default async function AdminReviewsPage() {
  const reviews = await db.review.findMany({
    include: { user: { select: { name: true, email: true } }, product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl tracking-wide">REVIEWS</h1>
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{r.product.name}</p>
                <p className="text-xs text-muted-foreground">{r.user.name} ({r.user.email}) · {formatDate(r.createdAt)}</p>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={cn("h-4 w-4", n <= r.rating ? "fill-accent text-accent" : "text-muted-foreground")} />
                ))}
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-center text-muted-foreground">No reviews yet.</p>}
      </div>
    </div>
  );
}
