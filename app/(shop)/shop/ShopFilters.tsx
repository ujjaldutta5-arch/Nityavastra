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
];

type CategoryOption = { slug: string; name: string };

type FilterUpdates = Partial<{
  category: string;
  sort: string;
  search: string;
  tag: string;
}>;

export default function ShopFilters({
  categories = [],
  currentCategory,
  currentSort,
  currentSearch,
  currentTag,
}: {
  categories?: CategoryOption[];
  currentCategory?: string;
  currentSort?: string;
  currentSearch?: string;
  currentTag?: string;
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
      ...updates,
    };
    Object.entries(next).forEach(([k, v]) => {
      if (v && v !== "all" && !(k === "sort" && v === "newest")) params.set(k, v);
    });
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
      <div className="flex flex-wrap gap-2">
        {cats.map((c) => (
          <button
            key={c.slug}
            type="button"
            data-testid={`filter-cat-${c.slug}`}
            onClick={() => push({ category: c.slug === "all" ? "" : c.slug })}
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
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
