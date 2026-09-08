import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

// Server-side authorization helpers. Every admin page/API route must call
// requireAdmin() — never rely on hiding a link in the UI. Client-side role
// checks are for UX only, never security.

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "ADMIN") redirect("/account");
  return user;
}

// Variant for API routes, which should return a 401/403 response rather
// than a redirect.
export async function requireAdminApi() {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized", status: 401 as const };
  if (user.role !== "ADMIN") return { error: "Forbidden", status: 403 as const };
  return { user };
}

export async function requireUserApi() {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized", status: 401 as const };
  return { user };
}
