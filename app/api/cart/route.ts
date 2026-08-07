import { requireUser, json, err } from "@/lib/api-auth";
import { getAvailableStock } from "@/lib/product-variants";
import type { Product } from "@/types";
import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

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

  const { data: product, error: pErr } = await ctx.admin
    .from("products")
    .select("*")
    .eq("id", product_id)
    .maybeSingle();
  if (pErr || !product) return err("Product not found", 404);

  const p = product as Product;
  if (p.has_variants && Array.isArray(p.variants) && p.variants.length && !variant_sku) {
    return err("Please select a size/color variant");
  }
  if (variant_sku && p.has_variants) {
    const v = (p.variants || []).find((x) => x.sku === variant_sku);
    if (!v) return err("Invalid variant SKU");
  }

  let existingQuery = ctx.admin
    .from("cart_items")
    .select("*")
    .eq("user_id", ctx.user.id)
    .eq("product_id", product_id);
  if (variant_sku) existingQuery = existingQuery.eq("variant_sku", variant_sku);
  else existingQuery = existingQuery.is("variant_sku", null);
  const { data: existing } = await existingQuery.maybeSingle();

  const currentQty = existing ? Number((existing as { quantity: number }).quantity) : 0;
  const desired = currentQty + Number(quantity);
  const available = getAvailableStock(p, variant_sku);
  if (desired > available) {
    return err(available <= 0 ? "Out of stock" : `Only ${available} left for this variant`);
  }

  if (existing) {
    const { data, error } = await ctx.admin
      .from("cart_items")
      .update({ quantity: desired })
      .eq("id", (existing as { id: string }).id)
      .select("*, products(*)")
      .single();
    if (error) return err(error.message, 500);
    void upsertAbandoned(ctx.admin, ctx.user.id);
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
  void upsertAbandoned(ctx.admin, ctx.user.id);
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
    else if (product_id) {
      q = q.eq("product_id", product_id);
      if (variant_sku) q = q.eq("variant_sku", variant_sku);
      else q = q.is("variant_sku", null);
    }
    await q;
    void upsertAbandoned(ctx.admin, ctx.user.id);
    return json({ ok: true });
  }

  let lineQuery = ctx.admin
    .from("cart_items")
    .select("*, products(*)")
    .eq("user_id", ctx.user.id);
  if (id) lineQuery = lineQuery.eq("id", id);
  else if (product_id) {
    lineQuery = lineQuery.eq("product_id", product_id);
    if (variant_sku) lineQuery = lineQuery.eq("variant_sku", variant_sku);
  } else return err("id or product_id required");

  const { data: line } = await lineQuery.maybeSingle();
  if (line) {
    const row = line as { products?: Product; variant_sku?: string | null };
    const p = row.products;
    const sku = row.variant_sku ?? variant_sku;
    if (p) {
      const available = getAvailableStock(p, sku);
      if (Number(quantity) > available) {
        return err(available <= 0 ? "Out of stock" : `Only ${available} left`);
      }
    }
  }

  let query = ctx.admin
    .from("cart_items")
    .update({ quantity: Number(quantity) })
    .eq("user_id", ctx.user.id);
  if (id) query = query.eq("id", id);
  else if (product_id) {
    query = query.eq("product_id", product_id);
    if (variant_sku) query = query.eq("variant_sku", variant_sku);
    else query = query.is("variant_sku", null);
  }
  const { data, error } = await query.select("*, products(*)").maybeSingle();
  if (error) return err(error.message, 500);
  void upsertAbandoned(ctx.admin, ctx.user.id);
  return json({ item: data });
}

export async function DELETE(request: Request) {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;
  const { searchParams } = new URL(request.url);
  let id = searchParams.get("id");
  let product_id = searchParams.get("product_id");
  let variant_sku: string | null = searchParams.get("variant_sku");
  let clear = searchParams.get("clear");
  try {
    const body = (await request.json()) as {
      id?: string;
      product_id?: string;
      variant_sku?: string | null;
      clear?: boolean | string;
    };
    id = id || body.id || null;
    product_id = product_id || body.product_id || null;
    if (body.variant_sku !== undefined) variant_sku = body.variant_sku;
    if (body.clear) clear = "1";
  } catch {
    /* no body */
  }
  if (clear === "1") {
    await ctx.admin.from("cart_items").delete().eq("user_id", ctx.user.id);
    void upsertAbandoned(ctx.admin, ctx.user.id);
    return json({ ok: true });
  }
  if (id) {
    await ctx.admin.from("cart_items").delete().eq("id", id).eq("user_id", ctx.user.id);
    void upsertAbandoned(ctx.admin, ctx.user.id);
    return json({ ok: true });
  }
  if (product_id) {
    let q = ctx.admin
      .from("cart_items")
      .delete()
      .eq("user_id", ctx.user.id)
      .eq("product_id", product_id);
    if (variant_sku) q = q.eq("variant_sku", variant_sku);
    await q;
    void upsertAbandoned(ctx.admin, ctx.user.id);
    return json({ ok: true });
  }
  return err("id required");
}

async function upsertAbandoned(admin: Admin, userId: string) {
  try {
    const { data: items } = await admin
      .from("cart_items")
      .select("product_id, quantity, variant_sku, products(name, price, image)")
      .eq("user_id", userId);

    const list = (items || []) as unknown as {
      product_id: string;
      quantity: number;
      variant_sku?: string | null;
      products?: { name?: string; price?: number; image?: string } | null;
    }[];

    await admin.from("abandoned_carts").delete().eq("user_id", userId);

    if (!list.length) return;

    const snapshot = list.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      variant_sku: i.variant_sku,
      name: i.products?.name,
      price: i.products?.price,
      image: i.products?.image,
    }));
    const total = snapshot.reduce(
      (s, i) => s + Number(i.price || 0) * Number(i.quantity || 0),
      0
    );

    await admin.from("abandoned_carts").insert({
      user_id: userId,
      items: snapshot,
      total,
      last_activity: new Date().toISOString(),
    });
  } catch {
    /* non-fatal */
  }
}
