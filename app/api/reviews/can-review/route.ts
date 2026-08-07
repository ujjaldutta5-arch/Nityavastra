import { requireUser, json, err } from "@/lib/api-auth";

export async function GET(request: Request) {
  const productId = new URL(request.url).searchParams.get("product_id");
  if (!productId) return err("product_id required");

  const ctx = await requireUser();
  if (ctx.error) return json({ canReview: false, reason: "login" });
  if (ctx.profile?.banned) return json({ canReview: false, reason: "banned" });

  const { data: existing } = await ctx.admin
    .from("reviews")
    .select("id")
    .eq("user_id", ctx.user.id)
    .eq("product_id", productId)
    .maybeSingle();
  if (existing) return json({ canReview: false, reason: "already" });

  const { data: orders } = await ctx.admin
    .from("orders")
    .select("order_items(product_id), payment_status")
    .eq("user_id", ctx.user.id)
    .in("payment_status", ["paid", "cod_pending", "refunded"]);

  type OrderItem = { product_id?: string };
  const purchased = ((orders || []) as { order_items?: OrderItem[] }[]).some((o) =>
    (o.order_items || []).some((i) => i.product_id === productId)
  );
  if (!purchased) return json({ canReview: false, reason: "not_purchased" });
  return json({ canReview: true });
}
