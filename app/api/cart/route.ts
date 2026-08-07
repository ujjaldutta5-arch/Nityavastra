import { requireUser, json, err } from "@/lib/api-auth";

export async function GET() {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;

  const { data: items, error } = await ctx.admin
    .from("cart_items")
    .select("*, products(*)")
    .eq("user_id", ctx.user.id)
    .order("created_at", { ascending: false });

  if (error) return err(error.message, 500);
  return json({ items: items || [] });
}

export async function POST(request: Request) {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as {
    product_id?: string;
    quantity?: number;
    variant_sku?: string | null;
  };
  const { product_id, quantity = 1, variant_sku = null } = body;
  if (!product_id) return err("product_id required");

  let existingQuery = ctx.admin
    .from("cart_items")
    .select("*")
    .eq("user_id", ctx.user.id)
    .eq("product_id", product_id);
  if (variant_sku) existingQuery = existingQuery.eq("variant_sku", variant_sku);
  else existingQuery = existingQuery.is("variant_sku", null);
  const { data: existing } = await existingQuery.maybeSingle();

  if (existing) {
    const { data, error } = await ctx.admin
      .from("cart_items")
      .update({ quantity: (existing as { quantity: number }).quantity + Number(quantity) })
      .eq("id", (existing as { id: string }).id)
      .select("*, products(*)")
      .single();
    if (error) return err(error.message, 500);
    return json({ item: data });
  }

  const { data, error } = await ctx.admin
    .from("cart_items")
    .insert({
      user_id: ctx.user.id,
      product_id,
      quantity: Number(quantity),
      variant_sku,
    })
    .select("*, products(*)")
    .single();
  if (error) return err(error.message, 500);
  return json({ item: data }, 201);
}

export async function PATCH(request: Request) {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as {
    id?: string;
    product_id?: string;
    quantity?: number;
    variant_sku?: string | null;
  };
  const { id, product_id, quantity, variant_sku = null } = body;
  if ((quantity ?? 0) <= 0) {
    let q = ctx.admin.from("cart_items").delete().eq("user_id", ctx.user.id);
    if (id) q = q.eq("id", id);
    else if (product_id) q = q.eq("product_id", product_id);
    await q;
    return json({ ok: true });
  }
  let query = ctx.admin.from("cart_items").update({ quantity: Number(quantity) }).eq("user_id", ctx.user.id);
  if (id) query = query.eq("id", id);
  else if (product_id) {
    query = query.eq("product_id", product_id);
    if (variant_sku) query = query.eq("variant_sku", variant_sku);
  } else return err("id or product_id required");
  const { data, error } = await query.select("*, products(*)").maybeSingle();
  if (error) return err(error.message, 500);
  return json({ item: data });
}

export async function DELETE(request: Request) {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;
  const { searchParams } = new URL(request.url);
  let id = searchParams.get("id");
  let product_id = searchParams.get("product_id");
  let clear = searchParams.get("clear");
  try {
    const body = (await request.json()) as {
      id?: string;
      product_id?: string;
      clear?: boolean | string;
    };
    id = id || body.id || null;
    product_id = product_id || body.product_id || null;
    if (body.clear) clear = "1";
  } catch {
    /* no body */
  }
  if (clear === "1") {
    await ctx.admin.from("cart_items").delete().eq("user_id", ctx.user.id);
    return json({ ok: true });
  }
  if (id) {
    await ctx.admin.from("cart_items").delete().eq("id", id).eq("user_id", ctx.user.id);
    return json({ ok: true });
  }
  if (product_id) {
    await ctx.admin.from("cart_items").delete().eq("product_id", product_id).eq("user_id", ctx.user.id);
    return json({ ok: true });
  }
  return err("id required");
}
