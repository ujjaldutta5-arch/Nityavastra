import { createAdminClient } from "@/lib/supabase/admin";
import { json, err } from "@/lib/api-auth";
import type { Product } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const limit = Math.min(24, Number(new URL(request.url).searchParams.get("limit") || 6));
  const admin = createAdminClient();
  const { data: product } = await admin.from("products").select("*").or(`id.eq.${id},slug.eq.${id}`).maybeSingle();
  const productRow = product as Product | null;
  if (!productRow) return err("Not found", 404);
  const { data } = await admin
    .from("products")
    .select("*")
    .eq("category", productRow.category)
    .neq("id", productRow.id)
    .limit(limit);
  return json({ products: data || [] });
}
