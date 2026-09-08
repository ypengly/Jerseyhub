# 🏆 JerseyHub

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**A full-stack sports jersey e-commerce platform with admin dashboard, customization, and dual payment flows**

[Features](#-features) • [Architecture](#-architecture) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Database](#-database) • [Deployment](#-deployment)

</div>

---

## 📖 Overview

JerseyHub is a complete e-commerce solution for sports merchandise, built with modern Next.js 14 patterns and a robust PostgreSQL backend. It delivers a seamless shopping experience with live product customization, intelligent inventory management, and a powerful admin dashboard.

### ✨ Key Capabilities

- **Live Customization** — Preview name and number changes in real-time on product detail pages
- **Dual Payment Paths** — Sandbox online payment or manual Telegram-based ordering
- **Smart Inventory** — Per-size stock tracking with automatic decrement on order confirmation
- **Admin Control** — Full CRUD operations, discount engine, order management, and analytics
- **Purchase-Gated Reviews** — Only verified buyers can leave product reviews

---

## 🚀 Features

### 👤 Customer Experience

| Feature | Description |
|---------|-------------|
| **Product Discovery** | Browse, search, and filter by sport, team, season, category, size, price, and sale status |
| **Product Details** | Image gallery with live name/number customization preview |
| **Cart Management** | Save-for-later, wishlist, and quantity adjustments |
| **3-Step Checkout** | Information → Shipping → Payment with clean UX flow |
| **Payment Options** | Sandbox online payment or manual Telegram contact link |
| **Order History** | Visual timeline: placed → confirmed → processing → shipped → delivered |
| **Reviews** | Purchase-gated reviews with moderation |
| **Notifications** | In-app notifications with unread counts |
| **Profile Management** | Address manager and account settings |

### 🛠️ Admin Dashboard

| Feature | Description |
|---------|-------------|
| **Analytics** | Revenue, orders, customers, products, and 14-day sales charts |
| **Inventory Alerts** | Low-stock warnings and inventory management |
| **Product Management** | Full CRUD with per-size stock and image management |
| **Discount Engine** | Percentage or fixed discounts with scheduled start/end dates |
| **Order Management** | Update payment/order status, "Mark as Paid" for Telegram orders (decrements stock) |
| **Customer Insights** | Lifetime spend tracking and customer list |
| **Review Moderation** | Approve or reject customer reviews |
| **Store Settings** | Configure shipping rates, Telegram username, and support email |

---

## 🏗️ Architecture

### Design Principles

**💰 Server-Side Pricing Authority**
> Every price, discount, and total is recomputed server-side in `lib/pricing.ts` from the current database state. The client never submits or modifies monetary values — cart, checkout, and admin views all call the same authoritative functions.

**📸 Immutable Order History**
> `OrderItem` stores its own snapshot of product name, price, size, and customization at purchase time. Editing a product later never rewrites historical orders.

**🔐 Layered Authorization**
> - `middleware.ts` handles coarse redirects for protected routes
> - `lib/authz.ts` performs real role checks (`CUSTOMER` vs `ADMIN`)
> - Every admin server action independently re-verifies the caller's role server-side
> - No admin functionality relies solely on UI hiding

**📦 Stock Decrement Timing**
> Stock is decremented **exactly once**, at the moment an order becomes `CONFIRMED`:
> - Immediately for sandbox online payments
> - When admin clicks "Mark as Paid" on Telegram orders

### Project Structure

```
jerseyhub/
├── app/
│   ├── actions/              # Server actions (cart, wishlist, orders, reviews)
│   │   └── admin/            # Admin-only server actions
│   ├── (public)/             # /, /shop, /product/[id], /teams, /sports, /search
│   ├── account/              # Customer dashboard, orders, wishlist, profile
│   ├── cart/                 # Shopping cart
│   ├── checkout/             # 3-step checkout flow
│   ├── admin/                # Admin dashboard (layout enforces role check)
│   └── api/auth/             # NextAuth route handler
├── components/
│   ├── ui/                   # Design system primitives
│   ├── layout/               # Layout components
│   ├── shop/                 # Product listings, filters, details
│   ├── cart/                 # Cart components
│   ├── checkout/             # Checkout flow components
│   ├── account/              # Customer dashboard components
│   ├── admin/                # Admin dashboard components
│   └── notifications/        # In-app notification system
├── lib/
│   ├── db.ts                 # Prisma client singleton
│   ├── auth.ts               # NextAuth configuration
│   ├── authz.ts              # Server-side role guards
│   ├── pricing.ts            # Single source of truth for money math
│   ├── validations.ts        # Zod schemas
│   ├── notifications.ts      # In-app notification helpers
│   └── serialize.ts          # Prisma → UI view-model mapping
└── prisma/
    ├── schema.prisma         # Full data model
    └── seed.ts               # Demo data generator
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Frontend** | React 18, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui primitives (Radix UI), Lucide icons |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Auth** | Auth.js (NextAuth) with credentials provider + JWT sessions |
| **Charts** | Recharts |
| **Validation** | Zod + React Hook Form |
| **Images** | Cloudinary or Supabase Storage |

---

## 💾 Database Schema

<details>
<summary><strong>Click to expand full schema overview</strong></summary>

```prisma
// Core Models
model Product {
  id          String
  name        String
  description String
  sport       String
  team        String
  season      String
  category    String
  basePrice   Float
  images      ProductImage[]
  variants    ProductVariant[]
  discounts   Discount[]
  reviews     Review[]
}

model ProductVariant {
  id       String
  product  Product
  size     String
  stock    Int
}

model Order {
  id              String
  user            User
  orderItems      OrderItem[]   // Snapshot data
  paymentMethod   PaymentMethod
  paymentStatus   PaymentStatus
  orderStatus     OrderStatus
  total           Float
}

model OrderItem {
  id             String
  order          Order
  productName    String         // Snapshot
  price          Float          // Snapshot
  size           String         // Snapshot
  customization  Json           // Name, number
}

model Discount {
  id          String
  type        DISCOUNT_TYPE   // PERCENTAGE | FIXED
  value       Float
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean         // Computed on read
}
```
</details>

### Key Entities

- **Product** → Images, Variants (per-size stock), Discounts, Reviews
- **Cart** → Cart Items (size, quantity, customization, saved-for-later flag)
- **Wishlist** → Wishlist Items
- **Order** → Order Items (immutable snapshots), payment/order status enums
- **Discount**: Percentage or fixed, with scheduled start/end dates
- **Notification**: Per-user, typed, with read/unread state
- **StoreSettings**: Singleton for Telegram username, shipping rates, support email

---

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/jerseyhub.git
cd jerseyhub

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with DATABASE_URL, NEXTAUTH_SECRET, etc.

# Set up database
npx prisma generate
npx prisma db push
# OR: npx prisma migrate dev --name init

# Seed demo data
npm run db:seed

# Start development server
npm run dev
```

Visit `http://localhost:3000`. Sign in as admin or register as a customer.

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for session signing |
| `NEXTAUTH_URL` | Base URL of your app |
| `CLOUDINARY_*` | Optional image upload configuration |
| `STRIPE_*` | Sandbox/test-mode keys (if using Stripe) |
| `NEXT_PUBLIC_TELEGRAM_USERNAME` | Default Telegram handle |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Demo admin credentials |

---

## 💳 Payment Flow

### Sandbox Online Payment
- Self-contained validation against test card `4242 4242 4242 4242`
- Simulates instant success — no external provider called
- No real charges ever possible

### Telegram Payment
- No bot token or API credentials needed
- Creates order as `PENDING_PAYMENT` / `PENDING`
- Customer shown Telegram contact link + order total
- Admin manually marks as paid → stock decremented

---

## 🚢 Deployment

### Production Checklist

1. **Database:** Provision PostgreSQL (Neon, Supabase, Railway, RDS)
2. **Environment:** Set all variables in hosting dashboard
3. **Deploy:** Vercel or any Node.js host supporting Next.js 14 App Router
4. **Migration:** Run `npx prisma migrate deploy` in build/release step
5. **Admin:** Create real admin account (don't use seeded credentials)
6. **Auth:** Set `NEXTAUTH_URL` to production domain, generate fresh secret

---

## 🧪 Known Limitations & Roadmap

| Area | Current Limitation | Planned Improvement |
|------|-------------------|---------------------|
| **Player Search** | Falls back to product name/team/description | Add `players: string[]` to Product for true player search |
| **Highest Rated Sort** | Proxies to review count | Denormalized `avgRating` with raw SQL sorting |
| **Image Uploads** | URL-paste only | Cloudinary/Supabase SDK for real uploads |
| **Payment** | Sandbox simulation only | Stripe integration with webhooks |
| **Testing** | No automated tests | Unit tests for pricing logic, integration tests for checkout |
| **Email** | In-app notifications only | Transactional email (order confirmations, shipping updates) |

---

## 🔒 Security Notes

- **Password Security:** bcrypt hashing, JWTs via NextAuth
- **Role Enforcement:** Every admin page and action re-checks role server-side
- **Price Integrity:** All monetary values computed from database on server
- **Secrets Management:** Environment variables only — never committed

---

## 📄 License

MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ as a portfolio project</sub>
  <br/>
  <sub>All product data is fictional/placeholder. No real payments are processed.</sub>
</div>
