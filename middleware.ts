export { default } from "next-auth/middleware";

// This middleware is a fast, coarse gate that redirects logged-out visitors
// away from account/admin routes before a page even renders. It is NOT the
// source of truth for authorization — role checks (CUSTOMER vs ADMIN) still
// happen server-side in lib/authz.ts on every admin page and server action,
// because middleware alone can't safely make role-based decisions with the
// JWT session strategy used here.
export const config = {
  matcher: ["/account/:path*", "/checkout", "/admin/:path*"],
};
