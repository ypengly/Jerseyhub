import { db } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { NotificationList } from "@/components/notifications/notification-list";

export default async function CustomerNotificationsPage() {
  const user = await requireUser();
  const notifications = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="mb-8 font-display text-4xl tracking-wide">NOTIFICATIONS</h1>
      <NotificationList notifications={notifications} />
    </div>
  );
}
