import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://nityavastra.com";

type SitemapRow = {
  slug?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const [{ data: products }, { data: pages }] = await Promise.all([
    supabase.from("products").select("slug, updated_at, created_at"),
    supabase.from("cms_pages").select("slug, updated_at, created_at"),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/shop",
    "/shop?category=sarees",
    "/shop?category=daily-wear",
    "/shop?category=home-essentials",
    "/about",
    "/contact",
  ].map((path) => ({
    url: `${SITE}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/shop" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = ((products || []) as SitemapRow[]).map((p) => ({
    url: `${SITE}/product/${p.slug}`,
    lastModified: new Date(p.updated_at || p.created_at || Date.now()),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const pageRoutes: MetadataRoute.Sitemap = ((pages || []) as SitemapRow[]).map((p) => ({
    url: `${SITE}/pages/${p.slug}`,
    lastModified: new Date(p.updated_at || p.created_at || Date.now()),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...productRoutes, ...pageRoutes];
}
