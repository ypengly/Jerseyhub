"use client";

import { useTransition } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, cn } from "@/lib/utils";
import { markNotificationRead, markAllNotificationsRead } from "@/app/actions/notification-actions";
import { useRouter } from "next/navigation";

type NotificationItem = { id: string; title: string; message: string; isRead: boolean; createdAt: Date };

export function NotificationList({ notifications }: { notifications: NotificationItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function markRead(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      router.refresh();
    });
  }

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">No notifications yet.</p>
      </div>
    );
  }

  return (
    <div>
      {unreadCount > 0 && (
        <div className="mb-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={markAll} disabled={isPending}>
            <CheckCheck className="mr-2 h-4 w-4" /> Mark all as read
          </Button>
        </div>
      )}
      <div className="space-y-2">
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => !n.isRead && markRead(n.id)}
            className={cn("flex w-full items-start justify-between gap-3 rounded-lg border p-4 text-left transition", n.isRead ? "border-border" : "border-accent/40 bg-accent/5")}
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{n.title}</p>
                {!n.isRead && <Badge className="h-2 w-2 rounded-full p-0" />}
              </div>
              <p className="text-sm text-muted-foreground">{n.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.createdAt)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
