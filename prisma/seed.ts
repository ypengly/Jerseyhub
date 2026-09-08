import { PrismaClient, Sport } from "@prisma/client";
import bcrypt from "bcryptjs";
import { slugify } from "../lib/utils";

const db = new PrismaClient();

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800",
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800",
  "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800",
];

type SeedProduct = {
  name: string;
  team: string;
  sport: Sport;
  season: string;
  category: string;
  price: number;
  discount?: { type: "PERCENTAGE" | "FIXED"; value: number; label: string };
  outOfStockSize?: string;
};

const PRODUCTS: SeedProduct[] = [
  { name: "Barcelona Home Jersey", team: "Barcelona", sport: "FOOTBALL", season: "2025/26", category: "Home", price: 99.99, discount: { type: "PERCENTAGE", value: 20, label: "SALE" } },
  { name: "Barcelona Away Jersey", team: "Barcelona", sport: "FOOTBALL", season: "2025/26", category: "Away", price: 94.99 },
  { name: "Real Madrid Home Jersey", team: "Real Madrid", sport: "FOOTBALL", season: "2025/26", category: "Home", price: 99.99, outOfStockSize: "XL" },
  { name: "Real Madrid Away Jersey", team: "Real Madrid", sport: "FOOTBALL", season: "2025/26", category: "Away", price: 94.99 },
  { name: "Liverpool Home Jersey", team: "Liverpool", sport: "FOOTBALL", season: "2025/26", category: "Home", price: 89.99, discount: { type: "FIXED", value: 15, label: "LIMITED DROP" } },
  { name: "Liverpool Third Jersey", team: "Liverpool", sport: "FOOTBALL", season: "2025/26", category: "Third", price: 84.99 },
  { name: "Arsenal Home Jersey", team: "Arsenal", sport: "FOOTBALL", season: "2025/26", category: "Home", price: 89.99 },
  { name: "Arsenal Away Jersey", team: "Arsenal", sport: "FOOTBALL", season: "2025/26", category: "Away", price: 89.99 },
  { name: "Manchester City Home Jersey", team: "Manchester City", sport: "FOOTBALL", season: "2025/26", category: "Home", price: 94.99 },
  { name: "Bayern Munich Home Jersey", team: "Bayern Munich", sport: "FOOTBALL", season: "2025/26", category: "Home", price: 94.99, discount: { type: "PERCENTAGE", value: 15, label: "SALE" } },
  { name: "PSG Home Jersey", team: "Paris Saint-Germain", sport: "FOOTBALL", season: "2025/26", category: "Home", price: 99.99 },
  { name: "Argentina National Team Jersey", team: "Argentina", sport: "FOOTBALL", season: "2025/26", category: "Home", price: 89.99, discount: { type: "PERCENTAGE", value: 10, label: "FAN FAVORITE" } },
  { name: "Brazil National Team Jersey", team: "Brazil", sport: "FOOTBALL", season: "2025/26", category: "Home", price: 89.99 },
  { name: "France National Team Jersey", team: "France", sport: "FOOTBALL", season: "2025/26", category: "Home", price: 89.99 },
  { name: "Lakers Jersey", team: "Los Angeles Lakers", sport: "BASKETBALL", season: "2025/26", category: "Home", price: 109.99, discount: { type: "PERCENTAGE", value: 25, label: "SALE" } },
  { name: "Lakers Away Jersey", team: "Los Angeles Lakers", sport: "BASKETBALL", season: "2025/26", category: "Away", price: 109.99 },
  { name: "Golden State Warriors Jersey", team: "Golden State Warriors", sport: "BASKETBALL", season: "2025/26", category: "Home", price: 109.99, outOfStockSize: "S" },
  { name: "Chicago Bulls Jersey", team: "Chicago Bulls", sport: "BASKETBALL", season: "2025/26", category: "Home", price: 104.99 },
  { name: "Boston Celtics Jersey", team: "Boston Celtics", sport: "BASKETBALL", season: "2025/26", category: "Home", price: 104.99 },
  { name: "Miami Heat Jersey", team: "Miami Heat", sport: "BASKETBALL", season: "2025/26", category: "Home", price: 104.99, discount: { type: "FIXED", value: 20, label: "CLEARANCE" } },
  { name: "Brooklyn Nets Jersey", team: "Brooklyn Nets", sport: "BASKETBALL", season: "2025/26", category: "Away", price: 99.99 },
];

const SIZES = ["S", "M", "L", "XL", "XXL"];

async function main() {
  console.log("Seeding database...");

  // --- Store settings ---
  await db.storeSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", storeName: "JerseyHub", telegramUsername: process.env.NEXT_PUBLIC_TELEGRAM_USERNAME || "jerseyhub_store" },
    update: {},
  });

  // --- Admin ---
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@jerseyhub.example").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "change-me-now";
  const adminHash = await bcrypt.hash(adminPassword, 10);
  await db.user.upsert({
    where: { email: adminEmail },
    create: { name: "Store Admin", email: adminEmail, passwordHash: adminHash, role: "ADMIN" },
    update: {},
  });
  console.log(`Admin account ready: ${adminEmail} (password from SEED_ADMIN_PASSWORD env var)`);

  // --- Customers ---
  const customerSeeds = [
    { name: "Alex Rivera", email: "alex@example.com" },
    { name: "Jamie Chen", email: "jamie@example.com" },
    { name: "Sam Okafor", email: "sam@example.com" },
    { name: "Taylor Kim", email: "taylor@example.com" },
    { name: "Morgan Silva", email: "morgan@example.com" },
  ];
  const customerPasswordHash = await bcrypt.hash("password123", 10);
  const customers = [];
  for (const c of customerSeeds) {
    const user = await db.user.upsert({
      where: { email: c.email },
      create: {
        name: c.name,
        email: c.email,
        passwordHash: customerPasswordHash,
        role: "CUSTOMER",
        cart: { create: {} },
        wishlist: { create: {} },
      },
      update: {},
    });
    customers.push(user);
  }
  console.log(`${customers.length} demo customers ready (password: password123)`);

  // --- Products ---
  const createdProducts = [];
  for (const p of PRODUCTS) {
    const slug = slugify(p.name);
    const product = await db.product.upsert({
      where: { slug },
      create: {
        name: p.name,
        slug,
        description: `Official-style ${p.team} ${p.category.toLowerCase()} jersey for the ${p.season} season. Breathable fabric, authentic fit, and full name/number customization available. Demo product for portfolio purposes.`,
        sport: p.sport,
        team: p.team,
        season: p.season,
        category: p.category,
        price: p.price,
        customizable: true,
        customizationPrice: 10,
        featured: Math.random() > 0.6,
        images: { create: PLACEHOLDER_IMAGES.map((url, i) => ({ url, position: i, altText: p.name })) },
        variants: {
          create: SIZES.map((size) => ({
            size,
            stock: p.outOfStockSize === size ? 0 : Math.floor(Math.random() * 20) + 3,
          })),
        },
      },
      update: {},
    });
    createdProducts.push(product);

    if (p.discount) {
      await db.discount.create({
        data: {
          productId: product.id,
          type: p.discount.type,
          value: p.discount.value,
          label: p.discount.label,
          startDate: new Date(Date.now() - 3 * 86400000),
          endDate: new Date(Date.now() + 21 * 86400000),
          isActive: true,
        },
      });
    }
  }
  console.log(`${createdProducts.length} products seeded`);

  // --- Orders (a few per customer) ---
  let orderCounter = 10480;
  for (const customer of customers.slice(0, 3)) {
    const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
    const variant = await db.productVariant.findFirst({ where: { productId: product.id, stock: { gt: 0 } } });
    if (!variant) continue;

    const orderNumber = `JH-${orderCounter++}`;
    const unitPrice = Number(product.price);
    const order = await db.order.create({
      data: {
        orderNumber,
        userId: customer.id,
        fullName: customer.name,
        email: customer.email,
        phone: "+1 555 0100",
        shippingAddress: "123 Fan Street",
        city: "Springfield",
        country: "USA",
        postalCode: "12345",
        subtotal: unitPrice,
        discountTotal: 0,
        shippingCost: 9.99,
        customizationTotal: 10,
        total: unitPrice + 9.99 + 10,
        paymentMethod: "ONLINE",
        paymentStatus: "PAID",
        orderStatus: "DELIVERED",
        items: {
          create: [
            {
              productId: product.id,
              productName: product.name,
              unitPrice,
              size: variant.size,
              quantity: 1,
              customName: "FAN",
              customNumber: "7",
              customizationPrice: 10,
              discountApplied: 0,
              lineTotal: unitPrice + 10,
            },
          ],
        },
      },
    });

    await db.review.upsert({
      where: { productId_userId: { productId: product.id, userId: customer.id } },
      create: {
        productId: product.id,
        userId: customer.id,
        rating: Math.floor(Math.random() * 2) + 4,
        comment: "Great quality jersey, fits true to size and the customization looks fantastic!",
      },
      update: {},
    });

    await db.notification.create({
      data: {
        userId: customer.id,
        title: "Order delivered",
        message: `Order #${order.orderNumber} has been delivered.`,
        type: "ORDER_DELIVERED",
        link: `/account/orders/${order.id}`,
        isRead: Math.random() > 0.5,
      },
    });
  }

  // One pending Telegram order for the admin dashboard demo
  const pendingCustomer = customers[3];
  const pendingProduct = createdProducts[5];
  const pendingVariant = await db.productVariant.findFirst({ where: { productId: pendingProduct.id, stock: { gt: 0 } } });
  if (pendingVariant) {
    const unitPrice = Number(pendingProduct.price);
    await db.order.create({
      data: {
        orderNumber: `JH-${orderCounter++}`,
        userId: pendingCustomer.id,
        fullName: pendingCustomer.name,
        email: pendingCustomer.email,
        phone: "+1 555 0101",
        shippingAddress: "456 Supporter Ave",
        city: "Rivertown",
        country: "USA",
        postalCode: "54321",
        subtotal: unitPrice,
        discountTotal: 0,
        shippingCost: 9.99,
        customizationTotal: 0,
        total: unitPrice + 9.99,
        paymentMethod: "TELEGRAM",
        paymentStatus: "PENDING",
        orderStatus: "PENDING_PAYMENT",
        items: {
          create: [
            {
              productId: pendingProduct.id,
              productName: pendingProduct.name,
              unitPrice,
              size: pendingVariant.size,
              quantity: 1,
              customizationPrice: 0,
              discountApplied: 0,
              lineTotal: unitPrice,
            },
          ],
        },
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
