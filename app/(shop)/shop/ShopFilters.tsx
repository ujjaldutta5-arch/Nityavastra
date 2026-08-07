"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/utils";

const TAGS = [
  { slug: "", name: "All tags" },
  { slug: "bestseller", name: "Bestsellers" },
  { slug: "new-arrival", name: "New Arrivals" },
  { slug: "festive", name: "Festive" },
  { slug: "casual", name: "Casual" },
];

type CategoryOption = { slug: string; name: string };

type Facets = {
  fabrics: string[];
  colors: string[];
  sizes: string[];
  sub_categories: string[];
};

type FilterUpdates = Partial<{
  category: string;
  sort: string;
  search: string;
  tag: string;
  sub_category: string;
  fabric: string;
  color: string;
  size: string;
}>;

export default function ShopFilters({
  categories = [],
  currentCategory,
  currentSort,
  currentSearch,
  currentTag,
  currentSub,
  currentFabric,
  currentColor,
  currentSize,
  facets,
}: {
  categories?: CategoryOption[];
  currentCategory?: string;
  currentSort?: string;
  currentSearch?: string;
  currentTag?: string;
  currentSub?: string;
  currentFabric?: string;
  currentColor?: string;
  currentSize?: string;
  facets?: Facets;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(currentSearch || "");

  const cats: CategoryOption[] = categories.length
    ? [{ slug: "all", name: "All Products" }, ...categories]
    : [...CATEGORIES];

  const push = (updates: FilterUpdates) => {
    const params = new URLSearchParams();
    const next: Record<string, string | undefined> = {
      category: currentCategory,
      sort: currentSort,
      search: currentSearch,
      tag: currentTag,
      sub_category: currentSub,
      fabric: currentFabric,
      color: currentColor,
      size: currentSize,
      ...updates,
    };
    Object.entries(next).forEach(([k, v]) => {
      if (v && v !== "all" && !(k === "sort" && v === "newest")) params.set(k, v);
    });
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c.slug}
              type="button"
              data-testid={`filter-cat-${c.slug}`}
              onClick={() => push({ category: c.slug === "all" ? "" : c.slug, sub_category: "" })}
              className={`px-4 py-2 text-xs uppercase tracking-[0.15em] rounded-full border transition-colors ${
                (currentCategory || "all") === c.slug
                  ? "bg-[#7C1F30] text-white border-[#7C1F30]"
                  : "border-[#E7E5E4] text-[#57534E] hover:border-[#7C1F30]"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <form
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              push({ search });
            }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#78716C]" />
            <Input
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-9 bg-white w-full sm:w-52"
              data-testid="shop-search"
            />
          </form>

          <Select
            value={currentTag || "all"}
            onValueChange={(v) => push({ tag: v === "all" ? "" : v })}
          >
            <SelectTrigger className="w-full sm:w-40 bg-white" data-testid="shop-tag-select">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              {TAGS.map((t) => (
                <SelectItem key={t.slug || "all"} value={t.slug || "all"}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={currentSort || "newest"} onValueChange={(v) => push({ sort: v })}>
            <SelectTrigger className="w-full sm:w-40 bg-white" data-testid="shop-sort-select">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {(facets?.sub_categories?.length ?? 0) > 0 && (
          <Select
            value={currentSub || "all"}
            onValueChange={(v) => push({ sub_category: v === "all" ? "" : v })}
          >
            <SelectTrigger className="w-[140px] bg-white text-xs">
              <SelectValue placeholder="Sub-category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sub-cats</SelectItem>
              {facets!.sub_categories.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {(facets?.fabrics?.length ?? 0) > 0 && (
          <Select
            value={currentFabric || "all"}
            onValueChange={(v) => push({ fabric: v === "all" ? "" : v })}
          >
            <SelectTrigger className="w-[130px] bg-white text-xs">
              <SelectValue placeholder="Fabric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All fabrics</SelectItem>
              {facets!.fabrics.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {(facets?.colors?.length ?? 0) > 0 && (
          <Select
            value={currentColor || "all"}
            onValueChange={(v) => push({ color: v === "all" ? "" : v })}
          >
            <SelectTrigger className="w-[130px] bg-white text-xs">
              <SelectValue placeholder="Color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All colors</SelectItem>
              {facets!.colors.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {(facets?.sizes?.length ?? 0) > 0 && (
          <Select
            value={currentSize || "all"}
            onValueChange={(v) => push({ size: v === "all" ? "" : v })}
          >
            <SelectTrigger className="w-[120px] bg-white text-xs">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sizes</SelectItem>
              {facets!.sizes.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
