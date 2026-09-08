import { db } from "@/lib/db";
import { NotificationType } from "@prisma/client";

type NotifyInput = {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
};

export async function notify({ userId, title, message, type, link }: NotifyInput) {
  return db.notification.create({
    data: { userId, title, message, type, link },
  });
}

/** Fans a notification out to every admin account — used for store-wide events like a new order. */
export async function notifyAdmins(input: Omit<NotifyInput, "userId">) {
  const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  if (admins.length === 0) return;
  await db.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      title: input.title,
      message: input.message,
      type: input.type,
      link: input.link,
    })),
  });
}
