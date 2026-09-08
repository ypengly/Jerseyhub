import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { toProductCard } from "@/lib/serialize";
import { ProductCard } from "@/components/shop/product-card";
import { ShopFilters } from "@/components/shop/shop-filters";
import { getWishlistedProductIds } from "@/lib/queries";
import { Pagination } from "@/components/shop/pagination";

const PAGE_SIZE = 12;

export const metadata = { title: "Shop Jerseys — JerseyHub" };

type SearchParams = { [key: string]: string | string[] | undefined };

function buildWhere(sp: SearchParams): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (sp.sport) where.sport = sp.sport as "FOOTBALL" | "BASKETBALL" | "OTHER";
  if (sp.team) where.team = sp.team as string;
  if (sp.season) where.season = sp.season as string;
  if (sp.category) where.category = sp.category as string;

  if (sp.minPrice || sp.maxPrice) {
    where.price = {
      ...(sp.minPrice ? { gte: parseFloat(sp.minPrice as string) } : {}),
      ...(sp.maxPrice ? { lte: parseFloat(sp.maxPrice as string) } : {}),
    };
  }

  if (sp.sale === "true") {
    where.discounts = { some: { isActive: true, startDate: { lte: new Date() }, endDate: { gte: new Date() } } };
  }

  if (sp.availability === "in-stock") {
    where.variants = { some: { stock: { gt: 0 } } };
  }

  if (sp.size) {
    where.variants = { some: { size: sp.size as string, stock: { gt: 0 } } };
  }

  return where;
}

function buildOrderBy(sort?: string): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "newest":
      return { createdAt: "desc" };
    case "price-asc":
      return { price: "asc" };
    case "price-desc":
      return { price: "desc" };
    case "popular":
      return { reviews: { _count: "desc" } };
    case "rating":
      return { reviews: { _count: "desc" } }; // proxy — true avg-rating sort needs a raw query; documented in README as a future improvement
    default:
      return { featured: "desc" };
  }
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const page = Math.max(1, parseInt((searchParams.page as string) ?? "1", 10) || 1);
  const where = buildWhere(searchParams);
  const orderBy = buildOrderBy(searchParams.sort as string);

  const [products, total, teams, seasons, categories, wishlisted] = await Promise.all([
    db.product.findMany({
      where,
      include: { images: { orderBy: { position: "asc" } }, discounts: true, reviews: true, variants: true },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.product.count({ where }),
    db.product.findMany({ distinct: ["team"], select: { team: true }, orderBy: { team: "asc" } }),
    db.product.findMany({ distinct: ["season"], select: { season: true }, orderBy: { season: "desc" } }),
    db.product.findMany({ distinct: ["category"], select: { category: true }, orderBy: { category: "asc" } }),
    getWishlistedProductIds(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl tracking-wide">SHOP JERSEYS</h1>
        <p className="text-muted-foreground">{total} jerseys found</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <ShopFilters
          teams={teams.map((t) => t.team)}
          seasons={seasons.map((s) => s.season)}
          categories={categories.map((c) => c.category)}
        />

        <div>
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center">
              <p className="font-display text-2xl tracking-wide">No jerseys match your filters</p>
              <p className="mt-2 text-muted-foreground">Try adjusting or clearing your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
              {products.map((p) => {
                const card = toProductCard(p);
                return <ProductCard key={card.id} product={card} initialWishlisted={wishlisted.has(card.id)} />;
              })}
            </div>
          )}

          <Pagination currentPage={page} totalPages={totalPages} />
        </div>
      </div>
    </div>
  );
}
