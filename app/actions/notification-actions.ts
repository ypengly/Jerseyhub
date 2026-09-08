"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserApi } from "@/lib/authz";

export async function markNotificationRead(id: string) {
  const auth = await requireUserApi();
  if ("error" in auth) return { error: auth.error };

  const notif = await db.notification.findUnique({ where: { id } });
  if (!notif || notif.userId !== auth.user.id) return { error: "Not found" };

  await db.notification.update({ where: { id }, data: { isRead: true } });
  revalidatePath("/account/notifications");
  revalidatePath("/admin/notifications");
  return { success: true };
}

export async function markAllNotificationsRead() {
  const auth = await requireUserApi();
  if ("error" in auth) return { error: auth.error };

  await db.notification.updateMany({ where: { userId: auth.user.id, isRead: false }, data: { isRead: true } });
  revalidatePath("/account/notifications");
  revalidatePath("/admin/notifications");
  return { success: true };
}
