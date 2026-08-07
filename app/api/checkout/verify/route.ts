import { requireUser, json, err } from "@/lib/api-auth";
import { getRazorpayConfig, verifyPaymentSignature } from "@/lib/payments";
import { notifyOrderEvent } from "@/lib/notifications";
import type { Order } from "@/types";

async function finalizePaidOrder(
  ctx: Awaited<ReturnType<typeof requireUser>> & { error?: undefined },
  orderRow: Order,
  updated: Record<string, unknown>
) {
  await ctx.admin.from("orders").update(updated).eq("id", orderRow.id);

  // Decrement stock now that payment succeeded (Razorpay path)
  const { data: items } = await ctx.admin
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderRow.id);

  for (const item of items || []) {
    const row = item as { product_id: string; quantity: number };
    const { data: prod } = await ctx.admin.from("products").select("stock").eq("id", row.product_id).maybeSingle();
    if (prod) {
      await ctx.admin
        .from("products")
        .update({ stock: Math.max(0, Number((prod as { stock: number }).stock) - row.quantity) })
        .eq("id", row.product_id);
      await ctx.admin.from("stock_audits").insert({
        product_id: row.product_id,
        delta: -row.quantity,
        reason: `order ${orderRow.id}`,
        actor_id: ctx.user.id,
      });
    }
  }

  if (orderRow.coupon_code) {
    const { data: coupon } = await ctx.admin
      .from("coupons")
      .select("id, used_count")
      .eq("code", orderRow.coupon_code)
      .maybeSingle();
    if (coupon) {
      await ctx.admin
        .from("coupons")
        .update({ used_count: Number((coupon as { used_count?: number }).used_count || 0) + 1 })
        .eq("id", (coupon as { id: string }).id);
    }
  }

  await ctx.admin.from("cart_items").delete().eq("user_id", ctx.user.id);
  await notifyOrderEvent({ ...orderRow, ...updated }, "order_placed");
  return json({ ok: true, order: { ...orderRow, ...updated } });
}

export async function POST(request: Request) {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as {
    order_id?: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    mock?: boolean;
  };
  const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, mock } = body;

  if (!order_id) return err("order_id required");

  const { data: order } = await ctx.admin.from("orders").select("*").eq("id", order_id).maybeSingle();
  const orderRow = order as Order | null;
  if (!orderRow || orderRow.user_id !== ctx.user.id) return err("Order not found", 404);

  if (orderRow.payment_status === "paid") {
    return json({ ok: true, order: orderRow });
  }

  // Mock pay only when explicitly allowed for local testing
  if (mock) {
    if (process.env.ALLOW_MOCK_PAY !== "true") {
      return err("Mock payment is disabled. Configure Razorpay keys.", 403);
    }
    return finalizePaidOrder(ctx, orderRow, {
      payment_status: "paid",
      status: "paid",
      razorpay_payment_id: "mock_pay",
      updated_at: new Date().toISOString(),
    });
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return err("Payment details required", 400);
  }

  const cfg = await getRazorpayConfig();
  const ok = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
    secret: cfg.key_secret,
  });
  if (!ok) return err("Invalid payment signature", 400);

  return finalizePaidOrder(ctx, orderRow, {
    payment_status: "paid",
    status: "paid",
    razorpay_order_id,
    razorpay_payment_id,
    updated_at: new Date().toISOString(),
  });
}
