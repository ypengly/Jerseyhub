"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Menu, Search, ShoppingCart, Heart, Bell, User, X, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Logo } from "./site-header";

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/teams", label: "Teams" },
  { href: "/sports", label: "Sports" },
];

export function HeaderClient({
  user,
  cartCount,
  unreadCount,
}: {
  user: { name: string; role: "CUSTOMER" | "ADMIN" } | null;
  cartCount: number;
  unreadCount: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <button className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
          <Logo />
          <nav className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-semibold uppercase tracking-wide text-muted-foreground transition hover:text-foreground">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden flex-1 max-w-md md:block">
          <form onSubmit={submitSearch} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search jerseys, teams, players..."
              className="pl-9"
            />
          </form>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-2 md:hidden" onClick={() => setSearchOpen((s) => !s)} aria-label="Search">
            <Search className="h-5 w-5" />
          </button>

          {user && (
            <Link href="/account/notifications" className="relative p-2" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          <Link href="/account/wishlist" className="hidden p-2 sm:block" aria-label="Wishlist">
            <Heart className="h-5 w-5" />
          </Link>

          <Link href="/cart" className="relative p-2" aria-label="Cart">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="group relative">
              <button className="flex items-center gap-2 p-2">
                <User className="h-5 w-5" />
              </button>
              <div className="invisible absolute right-0 mt-1 w-48 rounded-md border border-border bg-card p-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                <p className="px-3 py-2 text-xs text-muted-foreground">Signed in as {user.name}</p>
                {user.role === "ADMIN" && (
                  <Link href="/admin" className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-muted">
                    <LayoutDashboard className="h-4 w-4" /> Admin dashboard
                  </Link>
                )}
                <Link href="/account" className="block rounded-sm px-3 py-2 text-sm hover:bg-muted">Dashboard</Link>
                <Link href="/account/orders" className="block rounded-sm px-3 py-2 text-sm hover:bg-muted">Orders</Link>
                <Link href="/account/profile" className="block rounded-sm px-3 py-2 text-sm hover:bg-muted">Profile</Link>
                <button onClick={() => signOut({ callbackUrl: "/" })} className="block w-full rounded-sm px-3 py-2 text-left text-sm text-destructive hover:bg-muted">
                  Log out
                </button>
              </div>
            </div>
          ) : (
            <Button asChild size="sm" className="ml-1 hidden sm:inline-flex">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-border p-3 md:hidden">
          <form onSubmit={submitSearch} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="pl-9" />
          </form>
        </div>
      )}

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-background md:hidden">
          <div className="container flex h-16 items-center justify-between">
            <Logo />
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="container flex flex-col gap-1 py-4">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-3 text-lg font-semibold hover:bg-muted">
                {l.label}
              </Link>
            ))}
            <Link href="/account/wishlist" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-3 text-lg font-semibold hover:bg-muted">
              Wishlist
            </Link>
            {!user && (
              <Button asChild className="mt-4">
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
