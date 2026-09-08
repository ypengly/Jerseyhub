import { requireAdmin } from "@/lib/authz";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side authorization gate — this runs on every admin route.
  // Customers are redirected before any admin data is ever queried.
  const admin = await requireAdmin();

  return (
    <div className="container grid gap-8 py-8 lg:grid-cols-[240px_1fr]">
      <AdminSidebar adminName={admin.name ?? "Admin"} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
