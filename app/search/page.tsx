import { db } from "@/lib/db";
import { toProductCard } from "@/lib/serialize";
import { ProductCard } from "@/components/shop/product-card";
import { getWishlistedProductIds } from "@/lib/queries";
import { Search } from "lucide-react";

export const metadata = { title: "Search — JerseyHub" };

// Searches product name, team, category, and description (a stand-in for
// "player" search — player names live in OrderItem/CartItem customization,
// not on Product, so a literal "search by player" would only make sense
// once a dedicated player/roster field exists; documented in the README).
export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim() ?? "";

  const products = q
    ? await db.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { team: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { images: { orderBy: { position: "asc" } }, discounts: true, reviews: true, variants: true },
        take: 24,
      })
    : [];

  const wishlisted = await getWishlistedProductIds();

  return (
    <div className="container py-10">
      <h1 className="mb-2 font-display text-4xl tracking-wide">SEARCH RESULTS</h1>
      <p className="mb-8 text-muted-foreground">{q ? `${products.length} results for "${q}"` : "Enter a search term to get started."}</p>

      {q && products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center">
          <Search className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="font-display text-2xl tracking-wide">No jerseys found</p>
          <p className="mt-2 text-muted-foreground">Try a different team, product name, or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
          {products.map((p) => {
            const card = toProductCard(p);
            return <ProductCard key={card.id} product={card} initialWishlisted={wishlisted.has(card.id)} />;
          })}
        </div>
      )}
    </div>
  );
}
