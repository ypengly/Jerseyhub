import Link from "next/link";
import { getCurrentUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { HeaderClient } from "./header-client";

export async function SiteHeader() {
  const user = await getCurrentUser();

  let cartCount = 0;
  let unreadCount = 0;

  if (user) {
    const [cart, unread] = await Promise.all([
      db.cart.findUnique({
        where: { userId: user.id },
        include: { items: { where: { savedForLater: false } } },
      }),
      db.notification.count({ where: { userId: user.id, isRead: false } }),
    ]);
    cartCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
    unreadCount = unread;
  }

  return (
    <HeaderClient
      user={user ? { name: user.name ?? "", role: user.role } : null}
      cartCount={cartCount}
      unreadCount={unreadCount}
    />
  );
}

export function Logo() {
  return (
    <Link href="/" className="font-display text-2xl tracking-wider">
      JERSEY<span className="text-accent">HUB</span>
    </Link>
  );
}
