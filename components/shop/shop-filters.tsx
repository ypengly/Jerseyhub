"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const SPORTS = [
  { value: "FOOTBALL", label: "Football" },
  { value: "BASKETBALL", label: "Basketball" },
  { value: "OTHER", label: "Other" },
];

const SIZES = ["S", "M", "L", "XL", "XXL"];

export function ShopFilters({ teams, seasons, categories }: { teams: string[]; seasons: string[]; categories: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function applyPriceRange() {
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set("minPrice", minPrice); else params.delete("minPrice");
    if (maxPrice) params.set("maxPrice", maxPrice); else params.delete("maxPrice");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <aside className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Filters</h2>
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>Clear all</Button>
      </div>

      <div>
        <Label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Sort By</Label>
        <Select value={searchParams.get("sort") ?? "featured"} onValueChange={(v) => updateParam("sort", v === "featured" ? null : v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Sport</Label>
        <Select value={searchParams.get("sport") ?? "all"} onValueChange={(v) => updateParam("sport", v === "all" ? null : v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sports</SelectItem>
            {SPORTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Team</Label>
        <Select value={searchParams.get("team") ?? "all"} onValueChange={(v) => updateParam("team", v === "all" ? null : v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Season</Label>
        <Select value={searchParams.get("season") ?? "all"} onValueChange={(v) => updateParam("season", v === "all" ? null : v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Seasons</SelectItem>
            {seasons.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Category</Label>
        <Select value={searchParams.get("category") ?? "all"} onValueChange={(v) => updateParam("category", v === "all" ? null : v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Size</Label>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => updateParam("size", searchParams.get("size") === size ? null : size)}
              className={`h-9 w-9 rounded-md border text-sm font-semibold ${searchParams.get("size") === size ? "border-accent bg-accent text-accent-foreground" : "border-border"}`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Price Range</Label>
        <div className="flex items-center gap-2">
          <Input placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} onBlur={applyPriceRange} type="number" />
          <span className="text-muted-foreground">–</span>
          <Input placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} onBlur={applyPriceRange} type="number" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="sale"
          checked={searchParams.get("sale") === "true"}
          onCheckedChange={(v) => updateParam("sale", v ? "true" : null)}
        />
        <Label htmlFor="sale">On Sale</Label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="in-stock"
          checked={searchParams.get("availability") === "in-stock"}
          onCheckedChange={(v) => updateParam("availability", v ? "in-stock" : null)}
        />
        <Label htmlFor="in-stock">In Stock Only</Label>
      </div>
    </aside>
  );
}
