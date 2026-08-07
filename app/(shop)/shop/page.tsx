import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import ShopFilters from "./ShopFilters";
import type { Product } from "@/types";

export const metadata = {
  title: "Shop All Products",
};

function asString(value: string | string[] | undefined, fallback = ""): string {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const category = asString(params?.category, "all") || "all";
  const search = asString(params?.search);
  const tag = asString(params?.tag);
  const sort = asString(params?.sort, "newest") || "newest";

  const supabase = await createClient();

  let query = supabase.from("products").select("*");

  if (category && category !== "all") {
    query = query.eq("category", category);
  }
  if (tag) {
    query = query.contains("tags", [tag]);
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (sort === "price-asc") query = query.order("price", { ascending: true });
  else if (sort === "price-desc") query = query.order("price", { ascending: false });
  else if (sort === "name") query = query.order("name", { ascending: true });
  else query = query.order("created_at", { ascending: false });

  const [{ data: products }, { data: categories }] = await Promise.all([
    query,
    supabase.from("categories").select("*").is("parent_slug", null).order("name"),
  ]);

  const list = (products || []) as Product[];
  const cats = (categories || []) as { slug: string; name: string }[];
  const title =
    category === "all"
      ? "The Full Collection"
      : cats.find((c) => c.slug === category)?.name || "Products";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 md:py-16">
      <div className="mb-8 md:mb-10">
        <p className="uppercase text-xs tracking-[0.3em] text-[#7C1F30] mb-3">Shop All</p>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2A1508] leading-none">
          {title}
        </h1>
        <p className="text-sm text-[#78716C] mt-3" data-testid="shop-count">
          {list.length} product{list.length !== 1 ? "s" : ""}
        </p>
      </div>

      <ShopFilters
        categories={cats}
        currentCategory={category}
        currentSort={sort}
        currentSearch={search}
        currentTag={tag}
      />

      {list.length === 0 ? (
        <div className="py-20 text-center text-[#78716C]" data-testid="shop-empty">
          <p className="mb-4">No products found.</p>
          <Link href="/shop" className="text-[#7C1F30] hover:underline">
            Clear filters
          </Link>
        </div>
      ) : (
        <div
          className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8 mt-8"
          data-testid="shop-grid"
        >
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
