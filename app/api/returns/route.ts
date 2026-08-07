import { requireUser, requireStaff, json, err } from "@/lib/api-auth";
import { notifyOrderEvent, queueNotification } from "@/lib/notifications";
import { getRazorpayClient } from "@/lib/payments";
import type { Order } from "@/types";

const WINDOW_DAYS = 7;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("admin") === "1") {
    const ctx = await requireStaff(["admin", "order_manager"]);
    if (ctx.error) return ctx.error;
    const status = searchParams.get("status");
    let q = ctx.admin.from("returns").select("*").order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    const { data } = await q;
    return json({ returns: data || [] });
  }

  const ctx = await requireUser();
  if (ctx.error) return ctx.error;
  const { data } = await ctx.admin
    .from("returns")
    .select("*")
    .eq("user_id", ctx.user.id)
    .order("created_at", { ascending: false });
  return json({ returns: data || [] });
}

export async function POST(request: Request) {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as {
    order_id?: string;
    type?: string;
    reason?: string;
    details?: string;
  };
  const { order_id, type = "return", reason, details } = body;
  if (!order_id || !reason) return err("order_id and reason required");

  const { data: order } = await ctx.admin.from("orders").select("*").eq("id", order_id).maybeSingle();
  const orderRow = order as Order | null;
  if (!orderRow || orderRow.user_id !== ctx.user.id) return err("Order not found", 404);
  if (!["shipped", "delivered"].includes(orderRow.status)) return err("Order not eligible");

  const anchor = new Date(
    (orderRow.delivered_at as string) ||
      (orderRow.shipped_at as string) ||
      (orderRow.updated_at as string)
  );
  const days = (Date.now() - anchor.getTime()) / (86400 * 1000);
  if (days > WINDOW_DAYS) return err("Return window expired");

  const { data: existing } = await ctx.admin.from("returns").select("id").eq("order_id", order_id).maybeSingle();
  if (existing) return err("Return already requested");

  const { data, error } = await ctx.admin
    .from("returns")
    .insert({
      order_id,
      user_id: ctx.user.id,
      type,
      reason,
      details: details || "",
      status: "pending",
    })
    .select()
    .single();
  if (error) return err(error.message, 500);

  await queueNotification({
    channel: "email",
    event: "return_requested",
    recipient: "admin",
    subject: `Return requested for ${order_id}`,
    body: `${type}: ${reason}`,
    user_id: ctx.user.id,
  });

  return json({ return: data }, 201);
}

export async function PATCH(request: Request) {
  const ctx = await requireStaff(["admin", "order_manager"]);
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as {
    id?: string;
    status?: string;
    restock?: boolean;
    initiate_refund?: boolean;
    admin_notes?: string;
  };
  const { id, status, restock, initiate_refund, admin_notes } = body;
  if (!id || !status) return err("id and status required");

  const { data: ret } = await ctx.admin.from("returns").select("*").eq("id", id).maybeSingle();
  const retRow = ret as {
    id: string;
    order_id: string;
    user_id: string;
    admin_notes?: string;
  } | null;
  if (!retRow) return err("Not found", 404);

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
    admin_notes: admin_notes || retRow.admin_notes,
  };

  if (status === "received" && restock) {
    const { data: items } = await ctx.admin.from("order_items").select("*").eq("order_id", retRow.order_id);
    for (const item of (items || []) as { product_id?: string; quantity: number }[]) {
      if (!item.product_id) continue;
      const { data: prod } = await ctx.admin.from("products").select("stock").eq("id", item.product_id).maybeSingle();
      if (prod) {
        await ctx.admin
          .from("products")
          .update({ stock: Number((prod as { stock: number }).stock) + item.quantity })
          .eq("id", item.product_id);
        await ctx.admin.from("stock_audits").insert({
          product_id: item.product_id,
          delta: item.quantity,
          reason: `return ${retRow.id}`,
          actor_id: ctx.user.id,
        });
      }
    }
    updates.restock = true;
  }

  if (status === "refunded" && initiate_refund) {
    const { data: order } = await ctx.admin.from("orders").select("*").eq("id", retRow.order_id).maybeSingle();
    const orderRow = order as Order | null;
    if (orderRow?.payment_method === "razorpay" && orderRow.razorpay_payment_id && process.env.RAZORPAY_KEY_ID) {
      try {
        const { client } = await getRazorpayClient();
        const rf = (await client.payments.refund(orderRow.razorpay_payment_id as string, {
          amount: Math.round(Number(orderRow.total) * 100),
        })) as { id: string };
        updates.refund_id = rf.id;
        updates.refund_amount = orderRow.total;
        await ctx.admin
          .from("orders")
          .update({ payment_status: "refunded", status: "refunded", refund_id: rf.id })
          .eq("id", orderRow.id);
        await notifyOrderEvent(orderRow, "order_refunded");
      } catch (e: unknown) {
        return err((e as Error).message || "Refund failed", 500);
      }
    } else {
      updates.refund_id = "manual";
      updates.refund_amount = orderRow?.total;
      await ctx.admin
        .from("orders")
        .update({ payment_status: "refunded", status: "refunded", refund_id: "manual" })
        .eq("id", retRow.order_id);
    }
  }

  const { data, error } = await ctx.admin.from("returns").update(updates).eq("id", id).select().single();
  if (error) return err(error.message, 500);

  await queueNotification({
    channel: "email",
    event: "return_status",
    recipient: retRow.user_id,
    subject: `Return ${status}`,
    body: `Your return request is now ${status}`,
    user_id: retRow.user_id,
  });

  return json({ return: data });
}
