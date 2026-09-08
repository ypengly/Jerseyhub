"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createProduct, updateProduct } from "@/app/actions/admin/product-actions";

type SizeRow = { size: string; stock: number };
type ImageRow = { url: string; altText?: string };

export type ProductFormValues = {
  name: string;
  description: string;
  sport: "FOOTBALL" | "BASKETBALL" | "OTHER";
  team: string;
  season: string;
  category: string;
  price: number;
  customizable: boolean;
  customizationPrice: number;
  featured: boolean;
  isActive: boolean;
  sizes: SizeRow[];
  images: ImageRow[];
};

const DEFAULT_VALUES: ProductFormValues = {
  name: "",
  description: "",
  sport: "FOOTBALL",
  team: "",
  season: "2025/26",
  category: "Home",
  price: 79.99,
  customizable: true,
  customizationPrice: 10,
  featured: false,
  isActive: true,
  sizes: [{ size: "S", stock: 10 }, { size: "M", stock: 10 }, { size: "L", stock: 10 }, { size: "XL", stock: 10 }, { size: "XXL", stock: 5 }],
  images: [{ url: "" }],
};

export function ProductForm({ productId, initialValues }: { productId?: string; initialValues?: ProductFormValues }) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormValues>(initialValues ?? DEFAULT_VALUES);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateSize(index: number, field: keyof SizeRow, value: string | number) {
    setForm((f) => ({ ...f, sizes: f.sizes.map((s, i) => (i === index ? { ...s, [field]: value } : s)) }));
  }

  function updateImage(index: number, value: string) {
    setForm((f) => ({ ...f, images: f.images.map((img, i) => (i === index ? { ...img, url: value } : img)) }));
  }

  async function handleSubmit() {
    const cleanedImages = form.images.filter((img) => img.url.trim().length > 0);
    if (cleanedImages.length === 0) {
      toast.error("Add at least one product image URL");
      return;
    }
    const payload = { ...form, images: cleanedImages };

    setSubmitting(true);
    const res = productId ? await updateProduct(productId, payload) : await createProduct(payload);
    setSubmitting(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(productId ? "Product updated" : "Product created");
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">Basic Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Product Name</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Barcelona Home Jersey" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className="h-24 w-full rounded-md border border-border bg-background p-3 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Sport</Label>
              <Select value={form.sport} onValueChange={(v) => update("sport", v as ProductFormValues["sport"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOOTBALL">Football</SelectItem>
                  <SelectItem value="BASKETBALL">Basketball</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Team</Label>
              <Input value={form.team} onChange={(e) => update("team", e.target.value)} placeholder="Barcelona" />
            </div>
            <div className="space-y-1.5">
              <Label>Season</Label>
              <Input value={form.season} onChange={(e) => update("season", e.target.value)} placeholder="2025/26" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => update("category", e.target.value)} placeholder="Home / Away / Third" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Pricing & Customization</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Price ($)</Label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => update("price", parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>Customization Price ($)</Label>
              <Input type="number" step="0.01" value={form.customizationPrice} onChange={(e) => update("customizationPrice", parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={form.customizable} onCheckedChange={(v) => update("customizable", !!v)} id="customizable" />
            <Label htmlFor="customizable">Allow name/number customization</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={form.featured} onCheckedChange={(v) => update("featured", !!v)} id="featured" />
            <Label htmlFor="featured">Featured product</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={form.isActive} onCheckedChange={(v) => update("isActive", !!v)} id="active" />
            <Label htmlFor="active">Active (visible in store)</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Sizes & Inventory</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {form.sizes.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <Input className="w-24" value={s.size} onChange={(e) => updateSize(i, "size", e.target.value.toUpperCase())} placeholder="Size" />
              <Input type="number" value={s.stock} onChange={(e) => updateSize(i, "stock", parseInt(e.target.value) || 0)} placeholder="Stock" />
              <Button size="icon" variant="outline" onClick={() => setForm((f) => ({ ...f, sizes: f.sizes.filter((_, idx) => idx !== i) }))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setForm((f) => ({ ...f, sizes: [...f.sizes, { size: "", stock: 0 }] }))}>
            <Plus className="mr-2 h-4 w-4" /> Add Size
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Images</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Paste Cloudinary / Supabase Storage image URLs. First image is the primary photo.</p>
          {form.images.map((img, i) => (
            <div key={i} className="flex items-center gap-3">
              <Input value={img.url} onChange={(e) => updateImage(i, e.target.value)} placeholder="https://res.cloudinary.com/.../jersey.jpg" />
              <Button size="icon" variant="outline" onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setForm((f) => ({ ...f, images: [...f.images, { url: "" }] }))}>
            <Plus className="mr-2 h-4 w-4" /> Add Image
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={submitting}>{submitting ? "Saving..." : productId ? "Save Changes" : "Create Product"}</Button>
        <Button variant="outline" onClick={() => router.push("/admin/products")}>Cancel</Button>
      </div>
    </div>
  );
}
