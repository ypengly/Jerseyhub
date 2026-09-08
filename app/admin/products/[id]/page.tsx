import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductForm, type ProductFormValues } from "@/components/admin/product-form";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await db.product.findUnique({
    where: { id: params.id },
    include: { images: { orderBy: { position: "asc" } }, variants: true },
  });

  if (!product) notFound();

  const initialValues: ProductFormValues = {
    name: product.name,
    description: product.description,
    sport: product.sport,
    team: product.team,
    season: product.season,
    category: product.category,
    price: Number(product.price),
    customizable: product.customizable,
    customizationPrice: Number(product.customizationPrice),
    featured: product.featured,
    isActive: product.isActive,
    sizes: product.variants.map((v) => ({ size: v.size, stock: v.stock })),
    images: product.images.map((i) => ({ url: i.url, altText: i.altText ?? undefined })),
  };

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl tracking-wide">EDIT PRODUCT</h1>
      <ProductForm productId={product.id} initialValues={initialValues} />
    </div>
  );
}
