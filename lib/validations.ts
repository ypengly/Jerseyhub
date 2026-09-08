import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(6),
  address: z.string().min(4),
  city: z.string().min(2),
  country: z.string().min(2),
  postalCode: z.string().min(2),
});

export const checkoutSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  address: z.string().min(4),
  city: z.string().min(2),
  country: z.string().min(2),
  postalCode: z.string().min(2),
  paymentMethod: z.enum(["ONLINE", "TELEGRAM"]),
});

export const cartItemSchema = z.object({
  productId: z.string(),
  size: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
  customName: z.string().max(20).optional().nullable(),
  customNumber: z
    .string()
    .max(3)
    .regex(/^\d*$/, "Number must be digits only")
    .optional()
    .nullable(),
});

export const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  sport: z.enum(["FOOTBALL", "BASKETBALL", "OTHER"]),
  team: z.string().min(2),
  season: z.string().min(2),
  category: z.string().min(2),
  price: z.number().positive(),
  customizable: z.boolean(),
  customizationPrice: z.number().min(0),
  featured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sizes: z
    .array(z.object({ size: z.string(), stock: z.number().int().min(0) }))
    .min(1, "At least one size is required"),
  images: z.array(z.object({ url: z.string().url(), altText: z.string().optional() })).min(1),
});

export const discountSchema = z
  .object({
    productId: z.string(),
    type: z.enum(["PERCENTAGE", "FIXED"]),
    value: z.number().positive(),
    label: z.string().min(1),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => d.endDate > d.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  })
  .refine((d) => (d.type === "PERCENTAGE" ? d.value <= 100 : true), {
    message: "Percentage discount cannot exceed 100",
    path: ["value"],
  });

export const reviewSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3).max(1000),
  imageUrl: z.string().url().optional().nullable(),
});
