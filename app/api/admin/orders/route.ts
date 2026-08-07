import { requireStaff, json, err } from "@/lib/api-auth";
import { notifyOrderEvent } from "@/lib/notifications";
import { getRazorpayClient } from "@/lib/payments";
import type { Order } from "@/types";

export async function GET(request: Request) {
  const ctx = await requireStaff(["admin", "order_manager"]);
  if (ctx.error) return ctx.error;
  const status = new URL(request.url).searchParams.get("status");
  let q = ctx.admin.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return err(error.message, 500);
  return json({ orders: data || [] });
}

export async function PATCH(request: Request) {
  const ctx = await requireStaff(["admin", "order_manager"]);
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as {
    id?: string;
    status?: string;
    tracking_number?: string;
    courier_name?: string;
    tracking_url?: string;
    refund?: boolean;
  };
  const { id, status, tracking_number, courier_name, tracking_url, refund } = body;
  if (!id) return err("id required");

  const { data: order } = await ctx.admin.from("orders").select("*").eq("id", id).maybeSingle();
  const orderRow = order as Order | null;
  if (!orderRow) return err("Not found", 404);

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status) {
    updates.status = status;
    if (status === "shipped") updates.shipped_at = new Date().toISOString();
    if (status === "delivered") updates.delivered_at = new Date().toISOString();
  }
  if (tracking_number !== undefined) updates.tracking_number = tracking_number;
  if (courier_name !== undefined) updates.courier_name = courier_name;
  if (tracking_url !== undefined) updates.tracking_url = tracking_url;

  if (refund) {
    if (
      orderRow.payment_method === "razorpay" &&
      orderRow.razorpay_payment_id &&
      process.env.RAZORPAY_KEY_ID
    ) {
      try {
        const { client } = await getRazorpayClient();
        const rf = (await client.payments.refund(orderRow.razorpay_payment_id as string, {
          amount: Math.round(Number(orderRow.total) * 100),
        })) as { id: string };
        updates.refund_id = rf.id;
        updates.payment_status = "refunded";
        updates.status = "refunded";
      } catch (e: unknown) {
        return err((e as Error).message || "Refund failed", 500);
      }
    } else {
      updates.payment_status = "refunded";
      updates.status = "refunded";
      updates.refund_id = "manual";
    }
  }

  const { data, error } = await ctx.admin.from("orders").update(updates).eq("id", id).select("*, order_items(*)").single();
  if (error) return err(error.message, 500);

  if (status === "shipped") await notifyOrderEvent(data, "order_shipped");
  if (status === "delivered") await notifyOrderEvent(data, "order_delivered");
  if (updates.payment_status === "refunded") await notifyOrderEvent(data, "order_refunded");

  return json({ order: data });
}
