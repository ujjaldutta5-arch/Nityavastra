import { requireUser, json, err } from "@/lib/api-auth";
import { generateOrderId } from "@/lib/utils";
import { calcGst, getRazorpayClient } from "@/lib/payments";
import { notifyOrderEvent } from "@/lib/notifications";

export async function POST(request: Request) {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;

  const body = (await request.json()) as {
    shipping_address?: {
      pincode?: string;
      line1?: string;
      name?: string;
      phone?: string;
      [key: string]: unknown;
    };
    payment_method?: string;
    coupon_code?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    notes?: string;
  };
  const {
    shipping_address,
    payment_method = "razorpay",
    coupon_code,
    customer_name,
    customer_email,
    customer_phone,
    notes,
  } = body;

  if (!shipping_address?.pincode || !shipping_address?.line1) {
    return err("Complete shipping address required");
  }

  // Require Razorpay keys up front (no silent mock skip)
  if (payment_method === "razorpay") {
    try {
      await getRazorpayClient();
    } catch {
      if (process.env.ALLOW_MOCK_PAY === "true") {
        // continue — mock allowed only when explicitly enabled
      } else {
        return err(
          "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local (test keys from Razorpay Dashboard).",
          503
        );
      }
    }
  }

  const { data: cartRows } = await ctx.admin
    .from("cart_items")
    .select("*, products(*)")
    .eq("user_id", ctx.user.id);

  if (!cartRows?.length) return err("Cart is empty");

  type CartRow = {
    product_id: string;
    variant_sku?: string | null;
    quantity: number;
    products?: {
      name?: string;
      image?: string;
      price?: number;
      gst_rate?: number;
      hsn?: string;
      stock?: number;
    } | null;
  };

  const items = (cartRows as CartRow[]).map((c) => ({
    product_id: c.product_id,
    product_name: c.products?.name || "Product",
    product_image: c.products?.image,
    variant_sku: c.variant_sku,
    quantity: c.quantity,
    unit_price: Number(c.products?.price || 0),
    gst_rate: Number(c.products?.gst_rate || 5),
    hsn: c.products?.hsn || "6304",
    line_total: Number(c.products?.price || 0) * c.quantity,
    stock: c.products?.stock,
  }));

  for (const item of items) {
    if ((item.stock ?? 0) < item.quantity) {
      return err(`Insufficient stock for ${item.product_name}`);
    }
  }

  const { data: settings } = await ctx.admin
    .from("store_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  type CouponRow = {
    id: string;
    code: string;
    type: string;
    value: number;
    min_order?: number;
    max_discount?: number | null;
    expires_at?: string | null;
    used_count?: number;
  };
  let discount = 0;
  let appliedCoupon: CouponRow | null = null;
  if (coupon_code) {
    const { data: coupon } = await ctx.admin
      .from("coupons")
      .select("*")
      .eq("code", coupon_code.toUpperCase())
      .eq("active", true)
      .maybeSingle();
    if (!coupon) return err("Invalid coupon");
    const c = coupon as unknown as CouponRow;
    if (c.expires_at && new Date(c.expires_at) < new Date()) return err("Coupon expired");
    const sub = items.reduce((s, i) => s + i.line_total, 0);
    if (sub < Number(c.min_order || 0)) return err(`Minimum order ₹${c.min_order}`);
    if (c.type === "percent") {
      discount = (sub * Number(c.value)) / 100;
      if (c.max_discount) discount = Math.min(discount, Number(c.max_discount));
    } else {
      discount = Number(c.value);
    }
    appliedCoupon = c;
  }

  const subtotal = items.reduce((s, i) => s + i.line_total, 0);
  const settingsRow = settings as {
    free_shipping_threshold?: number;
    base_shipping_fee?: number;
    cod_enabled?: boolean;
  } | null;
  const threshold = Number(settingsRow?.free_shipping_threshold ?? 999);
  const baseShip = Number(settingsRow?.base_shipping_fee ?? 79);
  const shipping_fee = subtotal - discount >= threshold ? 0 : baseShip;
  const totals = calcGst({ items, shippingFee: shipping_fee, discount });

  if (payment_method === "cod") {
    if (settingsRow && settingsRow.cod_enabled === false) return err("COD not available");
  }

  const orderId = generateOrderId();
  const orderRow = {
    id: orderId,
    user_id: ctx.user.id,
    status: payment_method === "cod" ? "cod_pending" : "pending",
    payment_status: payment_method === "cod" ? "cod_pending" : "pending",
    payment_method,
    coupon_code: appliedCoupon?.code || null,
    discount: totals.discount,
    subtotal: totals.subtotal,
    shipping_fee: totals.shipping_fee,
    tax_cgst: totals.tax_cgst,
    tax_sgst: totals.tax_sgst,
    tax_igst: totals.tax_igst,
    taxable_amount: totals.taxable_amount,
    total: totals.total,
    shipping_address,
    customer_name: customer_name || shipping_address.name || ctx.profile?.name,
    customer_email: customer_email || ctx.user.email || ctx.profile?.email,
    customer_phone: customer_phone || shipping_address.phone || ctx.profile?.phone,
    notes: notes || null,
  };

  const { error: orderErr } = await ctx.admin.from("orders").insert(orderRow);
  if (orderErr) return err(orderErr.message, 500);

  const orderItems = items.map((i) => ({
    order_id: orderId,
    product_id: i.product_id,
    product_name: i.product_name,
    product_image: i.product_image,
    variant_sku: i.variant_sku,
    quantity: i.quantity,
    unit_price: i.unit_price,
    gst_rate: i.gst_rate,
    hsn: i.hsn,
    line_total: i.line_total,
  }));
  await ctx.admin.from("order_items").insert(orderItems);

  // Only reserve stock for COD now; Razorpay waits until payment verify
  if (payment_method === "cod") {
    for (const item of items) {
      const { data: prod } = await ctx.admin.from("products").select("stock").eq("id", item.product_id).maybeSingle();
      if (prod) {
        await ctx.admin
          .from("products")
          .update({ stock: Math.max(0, Number((prod as { stock: number }).stock) - item.quantity) })
          .eq("id", item.product_id);
        await ctx.admin.from("stock_audits").insert({
          product_id: item.product_id,
          delta: -item.quantity,
          reason: `order ${orderId}`,
          actor_id: ctx.user.id,
        });
      }
    }
  }

  if (payment_method === "cod") {
    if (appliedCoupon) {
      await ctx.admin
        .from("coupons")
        .update({ used_count: Number(appliedCoupon.used_count || 0) + 1 })
        .eq("id", appliedCoupon.id);
    }
    await ctx.admin.from("cart_items").delete().eq("user_id", ctx.user.id);
    await notifyOrderEvent(orderRow, "order_placed");
    return json({ order: orderRow, method: "cod" });
  }

  // Razorpay
  try {
    const { client, cfg } = await getRazorpayClient();
    const rzpOrder = (await client.orders.create({
      amount: Math.round(totals.total * 100),
      currency: "INR",
      receipt: orderId,
      notes: { order_id: orderId },
    })) as { id: string; amount: number; currency: string };
    await ctx.admin
      .from("orders")
      .update({ razorpay_order_id: rzpOrder.id })
      .eq("id", orderId);

    return json({
      order: { ...orderRow, razorpay_order_id: rzpOrder.id },
      razorpay: {
        key_id: cfg.key_id,
        order_id: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
      },
      method: "razorpay",
    });
  } catch (e: unknown) {
    if (process.env.ALLOW_MOCK_PAY === "true" && !process.env.RAZORPAY_KEY_ID) {
      return json({
        order: orderRow,
        method: "mock",
        message: "Mock pay enabled (ALLOW_MOCK_PAY=true)",
      });
    }
    // Mark order cancelled so it doesn't look paid
    await ctx.admin
      .from("orders")
      .update({ status: "cancelled", payment_status: "failed", updated_at: new Date().toISOString() })
      .eq("id", orderId);
    return err((e as Error).message || "Payment init failed. Check Razorpay keys.", 500);
  }
}
