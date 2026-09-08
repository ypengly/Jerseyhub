"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, cn } from "@/lib/utils";
import { submitReview } from "@/app/actions/review-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ReviewData = {
  id: string;
  rating: number;
  comment: string;
  imageUrl: string | null;
  createdAt: Date;
  user: { name: string };
};

export function ReviewSection({ productId, reviews, canReview }: { productId: string; reviews: ReviewData[]; canReview: boolean }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (comment.trim().length < 3) {
      toast.error("Please write a short comment");
      return;
    }
    startTransition(async () => {
      const res = await submitReview({ productId, rating, comment: comment.trim() });
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Review submitted");
      setShowForm(false);
      setComment("");
      router.refresh();
    });
  }

  return (
    <section className="mt-20 max-w-3xl">
      <h2 className="mb-6 font-display text-3xl tracking-wide">REVIEWS</h2>

      {canReview && !showForm && (
        <Button variant="outline" onClick={() => setShowForm(true)} className="mb-6">Write a Review</Button>
      )}

      {showForm && (
        <div className="mb-8 rounded-xl border border-border p-5">
          <p className="mb-2 text-sm font-semibold">Your rating</p>
          <div className="mb-4 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)}>
                <Star className={cn("h-6 w-6", n <= rating ? "fill-accent text-accent" : "text-muted-foreground")} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts on this jersey..."
            className="h-24 w-full rounded-md border border-border bg-background p-3 text-sm"
          />
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={isPending}>Submit Review</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-muted-foreground">No reviews yet — be the first to share your experience.</p>
      ) : (
        <div className="space-y-6">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-border pb-6">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{r.user.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
              </div>
              <div className="my-1 flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={cn("h-4 w-4", n <= r.rating ? "fill-accent text-accent" : "text-muted-foreground")} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
