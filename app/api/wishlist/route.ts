import { requireUser, json, err } from "@/lib/api-auth";

export async function GET() {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;

  const { data: items } = await ctx.admin
    .from("wishlists")
    .select("*, products(*)")
    .eq("user_id", ctx.user.id)
    .order("created_at", { ascending: false });

  return json({ items: items || [] });
}

export async function POST(request: Request) {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as { product_id?: string };
  const { product_id } = body;
  if (!product_id) return err("product_id required");

  const { data: existing } = await ctx.admin
    .from("wishlists")
    .select("id")
    .eq("user_id", ctx.user.id)
    .eq("product_id", product_id)
    .maybeSingle();

  if (existing) {
    await ctx.admin.from("wishlists").delete().eq("id", (existing as { id: string }).id);
    return json({ removed: true });
  }

  const { error } = await ctx.admin.from("wishlists").insert({
    user_id: ctx.user.id,
    product_id,
  });
  if (error) return err(error.message, 500);
  return json({ added: true });
}
