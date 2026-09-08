"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserApi } from "@/lib/authz";
import { addressSchema } from "@/lib/validations";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional().nullable(),
});

export async function updateProfile(input: { name: string; phone?: string | null }) {
  const auth = await requireUserApi();
  if ("error" in auth) return { error: auth.error };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await db.user.update({ where: { id: auth.user.id }, data: { name: parsed.data.name, phone: parsed.data.phone || null } });
  revalidatePath("/account/profile");
  return { success: true };
}

export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  const auth = await requireUserApi();
  if ("error" in auth) return { error: auth.error };
  if (input.newPassword.length < 8) return { error: "New password must be at least 8 characters" };

  const user = await db.user.findUnique({ where: { id: auth.user.id } });
  if (!user) return { error: "User not found" };

  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) return { error: "Current password is incorrect" };

  const passwordHash = await bcrypt.hash(input.newPassword, 10);
  await db.user.update({ where: { id: user.id }, data: { passwordHash } });
  return { success: true };
}

export async function upsertAddress(input: z.infer<typeof addressSchema>) {
  const auth = await requireUserApi();
  if ("error" in auth) return { error: auth.error };

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid address" };

  // Simple model: keep a single default address per user for the demo checkout auto-fill.
  await db.address.updateMany({ where: { userId: auth.user.id }, data: { isDefault: false } });
  await db.address.create({ data: { ...parsed.data, userId: auth.user.id, isDefault: true } });

  revalidatePath("/account/profile");
  return { success: true };
}
