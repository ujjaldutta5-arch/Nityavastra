import { createClient } from "@/lib/supabase/server";
import type { Product, Profile } from "@/types";
import type { User } from "@supabase/supabase-js";

export type GetProductsOpts = {
  category?: string;
  sub_category?: string;
  featured?: boolean;
  limit?: number;
  tag?: string;
  search?: string;
  sort?: string;
  fabric?: string;
  color?: string;
  size?: string;
};

export async function getProducts(opts: GetProductsOpts = {}): Promise<Product[]> {
  const supabase = await createClient();
  let query = supabase.from("products").select("*").order("created_at", { ascending: false });
  if (opts.category && opts.category !== "all") query = query.eq("category", opts.category);
  if (opts.sub_category) query = query.eq("sub_category", opts.sub_category);
  if (opts.featured) query = query.eq("featured", true);
  if (opts.fabric) query = query.ilike("fabric", opts.fabric);
  if (opts.limit) query = query.limit(opts.limit);
  const { data, error } = await query;
  if (error) throw error;
  let rows = (data || []) as Product[];

  if (opts.tag) {
    rows = rows.filter((p) => (p.product_tags || p.tags || []).includes(opts.tag!));
  }
  if (opts.search) {
    const q = opts.search.toLowerCase();
    rows = rows.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.fabric?.toLowerCase().includes(q)
    );
  }
  if (opts.color) {
    const c = opts.color.toLowerCase();
    rows = rows.filter((p) => {
      const fromOpts = (p.color_options || []).some((o) => o.name?.toLowerCase() === c);
      const fromVariants = (p.variants || []).some((v) => v.color?.toLowerCase() === c);
      return fromOpts || fromVariants;
    });
  }
  if (opts.size) {
    const s = opts.size.toLowerCase();
    rows = rows.filter((p) => {
      const fromOpts = (p.size_options || []).some((x) => String(x).toLowerCase() === s);
      const fromVariants = (p.variants || []).some((v) => v.size?.toLowerCase() === s);
      return fromOpts || fromVariants;
    });
  }
  if (opts.sort === "price_asc") rows.sort((a, b) => a.price - b.price);
  else if (opts.sort === "price_desc") rows.sort((a, b) => b.price - a.price);
  else if (opts.sort === "popular")
    rows.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
  return rows;
}

export async function getProduct(idOrSlug: string): Promise<Product | null> {
  const supabase = await createClient();
  let { data } = await supabase.from("products").select("*").eq("slug", idOrSlug).maybeSingle();
  if (!data) {
    ({ data } = await supabase.from("products").select("*").eq("id", idOrSlug).maybeSingle());
  }
  return (data as Product | null) ?? null;
}

export async function getRelated(product: Product | null | undefined, limit = 4): Promise<Product[]> {
  if (!product) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("category", product.category)
    .neq("id", product.id)
    .limit(limit);
  return (data || []) as Product[];
}

export async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("display_order", { ascending: true });
  return data || [];
}

export async function getBanners() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("banners")
    .select("*")
    .eq("active", true)
    .order("display_order", { ascending: true });
  return data || [];
}

export async function getPage(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("cms_pages").select("*").eq("slug", slug).maybeSingle();
  return data;
}

export type StoreSettings = {
  free_shipping_threshold: number;
  base_shipping_fee: number;
  cod_enabled: boolean;
  whatsapp_number: string;
  [key: string]: unknown;
};

export async function getSettings(): Promise<StoreSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("store_settings").select("*").eq("id", "default").maybeSingle();
  return (
    (data as StoreSettings | null) || {
      free_shipping_threshold: 999,
      base_shipping_fee: 79,
      cod_enabled: true,
      whatsapp_number: "918777787700",
    }
  );
}

export type ProfileWithAuth =
  | (Profile & { authUser: User })
  | {
      id: string;
      email?: string;
      role: string;
      authUser: User;
    };

export async function getProfile(): Promise<ProfileWithAuth | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data
    ? { ...(data as Profile), authUser: user }
    : { id: user.id, email: user.email, role: "customer", authUser: user };
}

/** Derive facet values from a product list for shop filters. */
export function deriveFacets(products: Product[]) {
  const fabrics = new Set<string>();
  const colors = new Set<string>();
  const sizes = new Set<string>();
  const subs = new Set<string>();
  for (const p of products) {
    if (p.fabric) fabrics.add(p.fabric);
    if (p.sub_category) subs.add(p.sub_category);
    for (const c of p.color_options || []) if (c.name) colors.add(c.name);
    for (const v of p.variants || []) {
      if (v.color) colors.add(v.color);
      if (v.size) sizes.add(v.size);
    }
    for (const s of p.size_options || []) if (s) sizes.add(String(s));
  }
  return {
    fabrics: [...fabrics].sort(),
    colors: [...colors].sort(),
    sizes: [...sizes].sort(),
    sub_categories: [...subs].sort(),
  };
}
