import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { toProductCard } from "@/lib/serialize";
import { ProductCard } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import { getWishlistedProductIds } from "@/lib/queries";

const PRODUCT_INCLUDE = { images: { orderBy: { position: "asc" as const } }, discounts: true, reviews: true, variants: true };

export default async function HomePage() {
  const [newArrivals, bestSellers, saleProducts, wishlisted] = await Promise.all([
    db.product.findMany({ where: { isActive: true }, include: PRODUCT_INCLUDE, orderBy: { createdAt: "desc" }, take: 8 }),
    db.product.findMany({ where: { isActive: true }, include: PRODUCT_INCLUDE, orderBy: { reviews: { _count: "desc" } }, take: 8 }),
    db.product.findMany({
      where: { isActive: true, discounts: { some: { isActive: true, startDate: { lte: new Date() }, endDate: { gte: new Date() } } } },
      include: PRODUCT_INCLUDE,
      take: 8,
    }),
    getWishlistedProductIds(),
  ]);

  const teams = await db.product.groupBy({ by: ["team"], _count: true, orderBy: { _count: { team: "desc" } }, take: 6 });

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-foreground text-background">
        <div className="container grid items-center gap-10 py-20 md:grid-cols-2 md:py-32">
          <div className="animate-slide-up">
            <p className="mb-4 inline-block rounded-full border border-background/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
              New Season Collection
            </p>
            <h1 className="font-display text-6xl leading-[0.95] tracking-wide md:text-8xl">
              YOUR GAME.
              <br />
              YOUR <span className="text-accent">JERSEY.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-background/70">
              Premium sports jerseys for every fan. Customize with your name and number.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link href="/shop">SHOP JERSEYS</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-background/30 text-background hover:bg-background/10" asChild>
                <Link href="/teams">EXPLORE TEAMS</Link>
              </Button>
            </div>
          </div>
          <div className="relative aspect-square">
            <Image src="/hero-jersey.svg" alt="Featured jersey" fill className="object-contain drop-shadow-2xl" priority />
          </div>
        </div>
      </section>

      {/* PROMO BANNER */}
      <section className="bg-accent py-3 text-center text-sm font-semibold uppercase tracking-wide text-accent-foreground">
        Free shipping on orders over $120 · Custom names &amp; numbers on every eligible jersey
      </section>

      <div className="container space-y-20 py-16">
        {saleProducts.length > 0 && (
          <ProductSection title="On Sale" subtitle="Limited-time drops" href="/shop?sale=true" products={saleProducts} wishlisted={wishlisted} />
        )}

        <ProductSection title="New Arrivals" subtitle="Fresh off the press" href="/shop?sort=newest" products={newArrivals} wishlisted={wishlisted} />

        <ProductSection title="Best Sellers" subtitle="Fan favorites" href="/shop?sort=popular" products={bestSellers} wishlisted={wishlisted} />

        {/* TEAMS */}
        <section>
          <SectionHeader title="Popular Teams" subtitle="Shop by club or country" href="/teams" />
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {teams.map((t) => (
              <Link
                key={t.team}
                href={`/shop?team=${encodeURIComponent(t.team)}`}
                className="group rounded-xl border border-border bg-card p-6 text-center transition hover:border-accent"
              >
                <p className="font-display text-lg tracking-wide group-hover:text-accent">{t.team}</p>
                <p className="text-xs text-muted-foreground">{t._count} jerseys</p>
              </Link>
            ))}
          </div>
        </section>

        {/* SPORTS */}
        <section>
          <SectionHeader title="Sports" subtitle="Football, basketball, and more" href="/sports" />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {["FOOTBALL", "BASKETBALL", "OTHER"].map((sport) => (
              <Link
                key={sport}
                href={`/shop?sport=${sport}`}
                className="flex h-40 items-center justify-center rounded-xl bg-gradient-to-br from-muted to-card text-2xl font-display tracking-wide transition hover:from-accent/20"
              >
                {sport === "OTHER" ? "MORE SPORTS" : sport}
              </Link>
            ))}
          </div>
        </section>

        {/* NEWSLETTER */}
        <section className="rounded-2xl bg-card p-10 text-center">
          <h2 className="font-display text-3xl tracking-wide">STAY IN THE GAME</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Get early access to new drops, restocks, and exclusive discounts.
          </p>
          <form className="mx-auto mt-6 flex max-w-sm gap-2">
            <input
              type="email"
              required
              placeholder="Enter your email"
              className="h-11 flex-1 rounded-md border border-border bg-background px-4 text-sm"
            />
            <Button type="submit">Subscribe</Button>
          </form>
        </section>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, href }: { title: string; subtitle: string; href: string }) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <h2 className="font-display text-3xl tracking-wide">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Link href={href} className="hidden items-center gap-1 text-sm font-semibold text-accent sm:flex">
        View all <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function ProductSection({
  title,
  subtitle,
  href,
  products,
  wishlisted,
}: {
  title: string;
  subtitle: string;
  href: string;
  products: Parameters<typeof toProductCard>[0][];
  wishlisted: Set<string>;
}) {
  return (
    <section>
      <SectionHeader title={title} subtitle={subtitle} href={href} />
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
        {products.map((p) => {
          const card = toProductCard(p);
          return <ProductCard key={card.id} product={card} initialWishlisted={wishlisted.has(card.id)} />;
        })}
      </div>
    </section>
  );
}
