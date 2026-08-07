import { requireStaff, json, err } from "@/lib/api-auth";
import type { Product, ProductVariant } from "@/types";

/** Manual stock adjustment with audit log. */
export async function POST(request: Request) {
  const ctx = await requireStaff(["admin", "inventory_manager"]);
  if (ctx.error) return ctx.error;

  const body = (await request.json()) as {
    product_id?: string;
    delta?: number;
    note?: string;
    variant_sku?: string | null;
  };
  const product_id = body.product_id;
  const delta = Number(body.delta ?? 0);
  if (!product_id || !delta) return err("product_id and non-zero delta required");

  const { data: product, error: pErr } = await ctx.admin
    .from("products")
    .select("*")
    .eq("id", product_id)
    .single();
  if (pErr || !product) return err("Product not found", 404);

  const p = product as Product;
  let nextStock = Number(p.stock ?? 0);

  if (body.variant_sku && Array.isArray(p.variants) && p.variants.length) {
    const variants: ProductVariant[] = p.variants.map((v) => {
      if (v.sku !== body.variant_sku) return v;
      return { ...v, stock: Math.max(0, Number(v.stock ?? 0) + delta) };
    });
    nextStock = variants.reduce((s, v) => s + Number(v.stock ?? 0), 0);
    const { error } = await ctx.admin
      .from("products")
      .update({ variants, stock: nextStock, has_variants: true })
      .eq("id", product_id);
    if (error) return err(error.message, 500);
  } else {
    nextStock = Math.max(0, Number(p.stock ?? 0) + delta);
    const { error } = await ctx.admin
      .from("products")
      .update({ stock: nextStock })
      .eq("id", product_id);
    if (error) return err(error.message, 500);
  }

  await ctx.admin.from("stock_audits").insert({
    product_id,
    delta,
    reason: body.note || (body.variant_sku ? `variant:${body.variant_sku}` : "manual_adjust"),
    actor_id: ctx.user.id,
  });

  return json({ ok: true, stock: nextStock });
}
