"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/authz";
import { z } from "zod";

const settingsSchema = z.object({
  storeName: z.string().min(2),
  telegramUsername: z.string().min(2),
  supportEmail: z.string().email(),
  shippingFlat: z.number().min(0),
  freeShippingOver: z.number().min(0),
});

export async function updateStoreSettings(input: z.infer<typeof settingsSchema>) {
  const auth = await requireAdminApi();
  if ("error" in auth) return { error: auth.error };

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid settings" };

  await db.storeSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...parsed.data },
    update: parsed.data,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/checkout");
  return { success: true };
}
