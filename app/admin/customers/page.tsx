import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/utils";

export default async function AdminCustomersPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim();

  const customers = await db.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
    },
    include: { orders: { select: { total: true, paymentStatus: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl tracking-wide">CUSTOMERS</h1>

      <form className="mb-4">
        <input name="q" defaultValue={q} placeholder="Search by name or email..." className="h-10 w-full max-w-sm rounded-md border border-border bg-background px-3 text-sm" />
      </form>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Orders</th>
              <th className="p-3">Total Spent</th>
              <th className="p-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const totalSpent = c.orders.filter((o) => o.paymentStatus === "PAID").reduce((s, o) => s + Number(o.total), 0);
              return (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-muted-foreground">{c.email}</td>
                  <td className="p-3">{c.orders.length}</td>
                  <td className="p-3 font-semibold">{formatPrice(totalSpent)}</td>
                  <td className="p-3 text-xs text-muted-foreground">{formatDate(c.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {customers.length === 0 && <p className="p-6 text-center text-muted-foreground">No customers found.</p>}
      </div>
    </div>
  );
}
