import { requireStaff, json, err } from "@/lib/api-auth";
import {
  createShipment,
  getShiprocketStatus,
  trackAwb,
  cancelShipment,
  isShiprocketConfigured,
  mapShiprocketStatus,
} from "@/lib/shiprocket";
import { notifyOrderEvent } from "@/lib/notifications";
import type { Order } from "@/types";

type TrackResult = {
  tracking_data?: { track_status?: unknown; shipment_status?: unknown };
  status?: unknown;
};

export async function GET(request: Request) {
  const ctx = await requireStaff(["admin", "order_manager"]);
  if (ctx.error) return ctx.error;
  const action = new URL(request.url).searchParams.get("action") || "status";
  if (action === "status") return json(await getShiprocketStatus());
  if (action === "track") {
    const orderId = new URL(request.url).searchParams.get("order_id");
    const { data: order } = await ctx.admin.from("orders").select("*").eq("id", orderId).maybeSingle();
    const orderRow = order as Order | null;
    if (!orderRow?.shiprocket_awb) return err("No AWB");
    const track = await trackAwb(orderRow.shiprocket_awb as string);
    return json({ track });
  }
  return err("Unknown action");
}

export async function POST(request: Request) {
  const ctx = await requireStaff(["admin", "order_manager"]);
  if (ctx.error) return ctx.error;
  if (!isShiprocketConfigured()) return err("Shiprocket not configured", 503);

  const body = (await request.json()) as { action?: string; order_id?: string };
  const { action, order_id } = body;

  if (action === "ship") {
    const { data: order } = await ctx.admin
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", order_id)
      .maybeSingle();
    type ShipmentItem = {
      product_name: string;
      variant_sku?: string | null;
      product_id?: string;
      quantity: number;
      unit_price: number;
      hsn?: string | null;
    };
    const orderRow = order as (Order & { order_items?: ShipmentItem[] }) | null;
    if (!orderRow) return err("Order not found", 404);
    if (
      !["paid", "cod_pending"].includes(orderRow.payment_status) &&
      !["paid", "cod_pending"].includes(orderRow.status)
    ) {
      return err("Order must be paid or COD pending");
    }
    const result = await createShipment(
      orderRow,
      (orderRow.order_items || []) as ShipmentItem[]
    );
    const updates = {
      status: "shipped",
      shipped_at: new Date().toISOString(),
      shiprocket_awb: result.shiprocket_awb,
      shiprocket_order_id: result.shiprocket_order_id,
      courier_name: result.courier_name,
      tracking_url: result.tracking_url,
      tracking_number: result.shiprocket_awb,
      updated_at: new Date().toISOString(),
    };
    const { data } = await ctx.admin.from("orders").update(updates).eq("id", order_id).select("*, order_items(*)").single();
    await notifyOrderEvent(data, "order_shipped");
    return json({ order: data, label_url: result.label_url });
  }

  if (action === "cancel") {
    const { data: order } = await ctx.admin.from("orders").select("*").eq("id", order_id).maybeSingle();
    const orderRow = order as Order | null;
    if (!orderRow?.shiprocket_order_id) return err("No Shiprocket order");
    await cancelShipment([orderRow.shiprocket_order_id as string | number]);
    await ctx.admin.from("orders").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", order_id);
    return json({ ok: true });
  }

  if (action === "poll") {
    const { data: orders } = await ctx.admin
      .from("orders")
      .select("*")
      .not("shiprocket_awb", "is", null)
      .not("status", "in", '("delivered","cancelled","rto","refunded")');

    let updated = 0;
    const errors: { id: string; error: string }[] = [];
    for (const order of (orders || []) as Order[]) {
      try {
        const track = (await trackAwb(order.shiprocket_awb as string)) as TrackResult;
        const raw =
          track?.tracking_data?.track_status ||
          track?.tracking_data?.shipment_status ||
          track?.status ||
          "";
        const mapped = mapShiprocketStatus(String(raw));
        if (mapped && mapped !== order.status && String(raw) !== order.shiprocket_last_status) {
          const patch: Record<string, unknown> = {
            status: mapped,
            shiprocket_last_status: String(raw),
            updated_at: new Date().toISOString(),
          };
          if (mapped === "delivered") patch.delivered_at = new Date().toISOString();
          await ctx.admin.from("orders").update(patch).eq("id", order.id);
          if (mapped === "shipped") await notifyOrderEvent({ ...order, ...patch }, "order_shipped");
          if (mapped === "delivered") await notifyOrderEvent({ ...order, ...patch }, "order_delivered");
          updated += 1;
        }
      } catch (e: unknown) {
        errors.push({ id: order.id, error: (e as Error).message });
      }
    }
    return json({ checked: (orders || []).length, updated, errors, polled_at: new Date().toISOString() });
  }

  return err("Unknown action");
}
