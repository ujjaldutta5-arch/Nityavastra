import Link from "next/link";
import { getProducts, deriveFacets } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import ShopFilters from "./ShopFilters";

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
  const sub_category = asString(params?.sub_category);
  const fabric = asString(params?.fabric);
  const color = asString(params?.color);
  const size = asString(params?.size);

  const sortMap: Record<string, string> = {
    newest: "newest",
    "price-asc": "price_asc",
    "price-desc": "price_desc",
    popular: "popular",
    name: "newest",
  };

  const supabase = await createClient();
  const [{ data: categories }, { data: allForFacets }, list] = await Promise.all([
    supabase.from("categories").select("*").is("parent_slug", null).order("name"),
    supabase.from("products").select("fabric, sub_category, color_options, size_options, variants"),
    getProducts({
      category,
      sub_category: sub_category || undefined,
      search: search || undefined,
      tag: tag || undefined,
      fabric: fabric || undefined,
      color: color || undefined,
      size: size || undefined,
      sort: sortMap[sort] || "newest",
    }),
  ]);

  const facets = deriveFacets((allForFacets || []) as Parameters<typeof deriveFacets>[0]);
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
        currentSub={sub_category}
        currentFabric={fabric}
        currentColor={color}
        currentSize={size}
        facets={facets}
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
