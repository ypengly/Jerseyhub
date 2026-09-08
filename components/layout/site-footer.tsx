import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div>
          <span className="font-display text-2xl tracking-wider">
            JERSEY<span className="text-accent">HUB</span>
          </span>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Premium sports jerseys for every fan. Authentic feel, custom names and numbers, worldwide shipping.
          </p>
        </div>
        <FooterCol title="Shop" links={[
          { href: "/shop", label: "All Jerseys" },
          { href: "/shop?sale=true", label: "Sale" },
          { href: "/teams", label: "Teams" },
          { href: "/sports", label: "Sports" },
        ]} />
        <FooterCol title="Account" links={[
          { href: "/account", label: "Dashboard" },
          { href: "/account/orders", label: "Orders" },
          { href: "/account/wishlist", label: "Wishlist" },
          { href: "/auth/login", label: "Sign In" },
        ]} />
        <FooterCol title="Support" links={[
          { href: "/#", label: "Shipping Info" },
          { href: "/#", label: "Returns" },
          { href: "/#", label: "Size Guide" },
          { href: "/#", label: "Contact" },
        ]} />
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} JerseyHub. Demo store — for portfolio purposes only.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-bold uppercase tracking-wide">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
