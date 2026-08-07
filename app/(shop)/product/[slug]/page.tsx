import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductDetail from "./ProductDetail";
import type { Product } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("name, description, image")
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .maybeSingle();
  if (!data) return { title: "Product" };
  const product = data as { name: string; description?: string | null; image?: string | null };
  return {
    title: product.name,
    description: (product.description || "").slice(0, 155),
    openGraph: { images: product.image ? [product.image] : [] },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .maybeSingle();

  if (!product) notFound();

  return <ProductDetail product={product as Product} />;
}
