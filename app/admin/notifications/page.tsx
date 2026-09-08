import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/authz";
import { NotificationList } from "@/components/notifications/notification-list";

export default async function AdminNotificationsPage() {
  const admin = await requireAdmin();
  const notifications = await db.notification.findMany({ where: { userId: admin.id }, orderBy: { createdAt: "desc" } });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-3xl tracking-wide">NOTIFICATIONS</h1>
      <NotificationList notifications={notifications} />
    </div>
  );
}
