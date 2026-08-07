import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser, requireStaff, json, err } from "@/lib/api-auth";

type AdminClient = ReturnType<typeof createAdminClient>;

async function recomputeRating(admin: AdminClient, productId: string) {
  const { data } = await admin
    .from("reviews")
    .select("rating")
    .eq("product_id", productId)
    .eq("visible", true);
  const rows = (data || []) as { rating: number }[];
  const avg = rows.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : 4.5;
  await admin
    .from("products")
    .update({ rating: Math.round(avg * 10) / 10, review_count: rows.length })
    .eq("id", productId);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("product_id");
  const adminMode = searchParams.get("admin") === "1";

  if (adminMode) {
    const ctx = await requireStaff();
    if (ctx.error) return ctx.error;
    const filter = searchParams.get("filter");
    let q = ctx.admin.from("reviews").select("*, profiles(name, email, banned)").order("created_at", { ascending: false });
    if (filter === "hidden") q = q.eq("visible", false);
    if (filter === "featured") q = q.eq("featured", true);
    if (filter === "visible") q = q.eq("visible", true);
    const { data } = await q;
    return json({ reviews: data || [] });
  }

  if (!productId) return err("product_id required");
  const admin = createAdminClient();
  const { data } = await admin
    .from("reviews")
    .select("*, profiles(name)")
    .eq("product_id", productId)
    .eq("visible", true)
    .order("created_at", { ascending: false });
  return json({ reviews: data || [] });
}

export async function POST(request: Request) {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;
  if (ctx.profile?.banned) return err("Account banned", 403);

  const body = (await request.json()) as {
    product_id?: string;
    rating?: number;
    title?: string;
    comment?: string;
    photos?: unknown[];
  };
  const { product_id, rating, title, comment, photos = [] } = body;
  if (!product_id || !rating) return err("product_id and rating required");

  const { data: orders } = await ctx.admin
    .from("orders")
    .select("id, order_items(product_id), payment_status")
    .eq("user_id", ctx.user.id)
    .in("payment_status", ["paid", "cod_pending", "refunded"]);

  type OrderItem = { product_id?: string };
  const purchased = ((orders || []) as { order_items?: OrderItem[] }[]).some((o) =>
    (o.order_items || []).some((i) => i.product_id === product_id)
  );
  if (!purchased) return err("Only verified buyers can review");

  const { data, error } = await ctx.admin
    .from("reviews")
    .insert({
      product_id,
      user_id: ctx.user.id,
      rating: Number(rating),
      title: title || null,
      comment: comment || "",
      photos,
      visible: true,
    })
    .select()
    .single();
  if (error) return err(error.message, 500);

  await recomputeRating(ctx.admin, product_id);
  return json({ review: data }, 201);
}

export async function PATCH(request: Request) {
  const ctx = await requireStaff();
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as Record<string, unknown>;
  const { id, ...updates } = body;
  if (!id) return err("id required");
  const { data, error } = await ctx.admin.from("reviews").update(updates).eq("id", id as string).select().single();
  if (error) return err(error.message, 500);
  const review = data as { product_id?: string } | null;
  if (review?.product_id) await recomputeRating(ctx.admin, review.product_id);
  return json({ review: data });
}

export async function DELETE(request: Request) {
  const ctx = await requireStaff();
  if (ctx.error) return ctx.error;
  const id = new URL(request.url).searchParams.get("id");
  const { data: prev } = await ctx.admin.from("reviews").select("product_id").eq("id", id).maybeSingle();
  await ctx.admin.from("reviews").delete().eq("id", id);
  const prevRow = prev as { product_id?: string } | null;
  if (prevRow?.product_id) await recomputeRating(ctx.admin, prevRow.product_id);
  return json({ ok: true });
}
