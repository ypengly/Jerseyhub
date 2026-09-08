import { Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <div className="container py-10">
      <Skeleton className="mb-8 h-10 w-64" />
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <Skeleton className="h-96" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5]" />
          ))}
        </div>
      </div>
    </div>
  );
}
