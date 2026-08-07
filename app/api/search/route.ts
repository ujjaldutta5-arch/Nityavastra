import { createAdminClient } from "@/lib/supabase/admin";
import { json } from "@/lib/api-auth";

/** Public search autocomplete for navbar. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() || "";
  if (q.length < 2) return json({ products: [] });

  const admin = createAdminClient();
  const { data } = await admin
    .from("products")
    .select("id, name, slug, image, price, category")
    .or(`name.ilike.%${q}%,category.ilike.%${q}%,fabric.ilike.%${q}%`)
    .limit(8);

  return json({ products: data || [] });
}
