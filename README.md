# JerseyHub

A full-stack sports jersey e-commerce platform built with Next.js (App Router), TypeScript, PostgreSQL, and Prisma. Customers can browse, customize, and buy jerseys via a sandbox payment flow or manual Telegram payment; admins manage products, inventory, discounts, orders, and customers from a dedicated dashboard.

> **Portfolio / demo project.** All product data is fictional/placeholder. No real payments are ever processed — the "online payment" flow is a sandbox simulation, and Telegram payment is a manual, out-of-band flow with no bot integration or stored credentials.

---

## Features

**Customer**
- Browse, search, and filter jerseys by sport, team, season, category, size, price, and sale status
- Product detail pages with an image gallery and a live name/number customization preview
- Cart with save-for-later, wishlist, and a 3-step checkout (info → shipping → payment)
- Two payment paths: sandbox online payment, or manual payment via a Telegram contact link
- Order history with a visual status timeline (placed → confirmed → processing → shipped → delivered)
- Purchase-gated reviews, in-app notifications with unread counts, and a profile/address manager

**Admin**
- Dashboard: revenue, orders, customers, products, a 14-day sales chart, low-stock alerts, and pending Telegram payments
- Product CRUD with per-size inventory and image management
- Discount engine (percentage or fixed, scheduled start/end, auto-resolved "currently active" status)
- Order management: update payment/order status, one-click "Mark as Paid" for Telegram orders (decrements stock at that moment)
- Customer list with lifetime spend, inventory table, review moderation view, notifications, and store settings (shipping rates, Telegram username, support email)

---

## Tech Stack

- **Framework:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui-style primitives (Radix UI underneath), Lucide icons
- **Database/ORM:** PostgreSQL + Prisma
- **Auth:** Auth.js (NextAuth) with a credentials provider and JWT sessions carrying `role`
- **Charts:** Recharts
- **Validation:** Zod + React Hook Form
- **Images:** Cloudinary or Supabase Storage (bring your own — see Environment Variables)

---

## Architecture

```
app/
  actions/            Server actions — cart, wishlist, orders, reviews, profile, auth
    admin/            Admin-only server actions (product/order/discount/settings CRUD)
  (public pages)      /, /shop, /shop/[productId], /teams, /sports, /search, /auth/*
  account/            Customer dashboard, orders, wishlist, profile, notifications
  cart/, checkout/    Cart and checkout flow
  admin/              Admin dashboard + management pages (layout enforces requireAdmin())
  api/auth/           NextAuth route handler
components/
  ui/                 Design-system primitives (button, card, dialog, select, ...)
  layout/, shop/, cart/, checkout/, account/, admin/, notifications/
lib/
  db.ts               Prisma client singleton
  auth.ts, authz.ts    NextAuth config + server-side role guards
  pricing.ts          Server-side discount resolution & cart/order totals — the only source of truth for money math
  validations.ts      Zod schemas
  notifications.ts    In-app notification helpers (per-user and fan-out-to-admins)
  serialize.ts        Prisma row -> UI view-model mapping (product cards)
prisma/
  schema.prisma       Full data model
  seed.ts             Demo data generator
```

**Design principles carried through the codebase:**
- **Never trust client-submitted prices or totals.** Every price, discount, and total is recomputed server-side in `lib/pricing.ts` from the current database state — cart, checkout, and admin views all call the same functions.
- **Order line items are snapshots.** `OrderItem` stores its own copy of product name, price, size, and customization at the moment of purchase, so editing a product later never rewrites historical orders.
- **Authorization is server-side and layered.** `middleware.ts` does a coarse "must be logged in" redirect for `/account`, `/checkout`, and `/admin`; the real role check (`CUSTOMER` vs `ADMIN`) happens in `lib/authz.ts` and is called from the `admin/layout.tsx` server component and every admin server action — never from client-side UI hiding alone.
- **Stock is decremented exactly once**, at the moment an order becomes `CONFIRMED` — immediately for sandbox online payments, or when an admin clicks "Mark as Paid" on a Telegram order.

---

## Database Structure

See `prisma/schema.prisma` for the full model. Highlights:

- `Product` → `ProductImage[]`, `ProductVariant[]` (per-size stock), `Discount[]`, `Review[]`
- `Cart` → `CartItem[]` (size, quantity, custom name/number, saved-for-later flag)
- `Wishlist` → `WishlistItem[]`
- `Order` → `OrderItem[]` (immutable snapshot fields), with `paymentMethod`, `paymentStatus`, `orderStatus` enums
- `Discount`: `PERCENTAGE` or `FIXED`, with `startDate`/`endDate`/`isActive` — "currently active" is computed on read (`lib/pricing.ts`), so nothing needs a cron job to expire a sale
- `Notification`: per-user, typed, with read/unread state
- `StoreSettings`: singleton row for Telegram username, shipping rates, support email

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for session signing (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Base URL of your app in this environment |
| `CLOUDINARY_*` | Optional — only needed if you build out an image-upload UI beyond pasting URLs in the admin product form |
| `STRIPE_*` | Sandbox/test-mode keys if you wire the payment step to a real test provider (see below) |
| `NEXT_PUBLIC_TELEGRAM_USERNAME` | Default Telegram handle used to build the `t.me/<username>` contact link (overridable in Admin → Settings) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Credentials for the demo admin account created by `prisma/seed.ts` — used only locally, never committed |

---

## Installation & Running Locally

This project was written in a sandboxed environment with no network or database access, so it has **not** been `npm install`'d, built, or run yet. To get it running:

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# edit .env with your DATABASE_URL, NEXTAUTH_SECRET, etc.

# 3. Set up the database
npx prisma generate
npx prisma db push        # or: npx prisma migrate dev --name init

# 4. Seed demo data (20+ products, 5 customers, orders, reviews, 1 admin)
npm run db:seed

# 5. Run the dev server
npm run dev
```

Visit `http://localhost:3000`. Sign in as the seeded admin (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`) to reach `/admin`, or register a new customer account to shop.

**Demo customer accounts** (from the seed script): `alex@example.com`, `jamie@example.com`, `sam@example.com`, `taylor@example.com`, `morgan@example.com` — all with password `password123`. Change or remove these before deploying anywhere public.

---

## Payment Sandbox Setup

The **online payment** step in checkout is a self-contained sandbox: it validates against the well-known test card number `4242 4242 4242 4242` and simulates an instant success — no external payment provider is called, and no real charge is ever possible. To wire it to a real test-mode provider (e.g. Stripe test mode) instead:

1. Add your `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` (test keys only) to `.env`.
2. Replace the client-side card check in `components/checkout/checkout-flow.tsx` with a Stripe Elements form.
3. Replace the direct `createOrder(...)` call with a flow that creates a PaymentIntent server-side, confirms it, and only calls `createOrder` (or a new `confirmOnlinePayment` action) after Stripe reports success — verified via webhook (`STRIPE_WEBHOOK_SECRET`) for production-grade reliability.

## Telegram Configuration

No bot token or Telegram API credentials are needed. The store's Telegram username is stored in `StoreSettings.telegramUsername` (editable at **Admin → Settings**) and used to build a plain `https://t.me/<username>` link. When a customer chooses "Pay via Telegram," the order is created as `PENDING_PAYMENT` / `PENDING`, they're shown that link plus their order number and total, and an admin manually flips the order to `PAID`/`CONFIRMED` from **Admin → Orders** once payment is received elsewhere.

---

## Deployment

1. Provision a PostgreSQL database (Neon, Supabase, Railway, RDS, etc.) and set `DATABASE_URL`.
2. Deploy to Vercel (or any Node host that supports Next.js 14 App Router).
3. Set all environment variables from `.env.example` in your hosting provider's dashboard.
4. Run `npx prisma migrate deploy` as part of your build/release step.
5. Run the seed script once against production only if you want demo data there — otherwise seed nothing and create your real admin account directly in the database or via a one-off script.
6. Point `NEXTAUTH_URL` at your production domain and generate a fresh `NEXTAUTH_SECRET`.

---

## Known Limitations / Future Improvements

This was built end-to-end in a single pass; a few things are intentionally simplified and worth revisiting:

- **"Search by player"** currently falls back to searching product name/team/category/description, since player names only exist as free-text customization on cart/order items, not as a structured product field. Add a `players: string[]` field on `Product` (e.g. squad list) to support true player search.
- **"Highest rated" sort** currently proxies to review count rather than true average rating, since Prisma's `orderBy` can't sort by an aggregate across a relation without a raw query. Swap in a raw SQL query (or a denormalized `avgRating` column, updated on each new review) for exact sorting.
- **Image uploads** are URL-paste only in the admin form; wire up the Cloudinary/Supabase SDK for real file uploads.
- **Payment sandbox** is a self-contained simulation. See "Payment Sandbox Setup" above for wiring in a real test-mode provider with webhooks.
- **No automated tests yet** — the codebase is structured (server actions separated from UI, pricing logic isolated in `lib/pricing.ts`) to make unit-testing the money math and integration-testing the checkout flow straightforward to add.
- **Email notifications** are out of scope per the spec (in-app notifications only); adding transactional email (order confirmations, shipping updates) would be a natural next step using the same event hooks already in `lib/notifications.ts`.

---

## Security Notes

- Passwords are hashed with bcrypt; sessions are signed JWTs via NextAuth.
- Every admin page and admin server action independently re-checks the caller's role server-side — there is no admin functionality that relies solely on hiding a UI element.
- All prices, discounts, and totals are computed from the database on the server; nothing from `checkout-flow.tsx` or any client component is trusted for money math.
- Secrets live only in environment variables — none are committed to source, and `.env.example` contains no real values.
