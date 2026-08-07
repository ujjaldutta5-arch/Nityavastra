import { createAdminClient } from "@/lib/supabase/admin";
import { mapShiprocketStatus } from "@/lib/shiprocket";
import { notifyOrderEvent } from "@/lib/notifications";
import { json } from "@/lib/api-auth";
import type { Order } from "@/types";

export async function POST(request: Request) {
  // Always 200 so Shiprocket does not retry infinitely
  try {
    const token = process.env.SHIPROCKET_WEBHOOK_TOKEN;
    if (token) {
      const hdr = request.headers.get("x-api-key") || request.headers.get("authorization") || "";
      if (!hdr.includes(token)) {
        console.warn("Shiprocket webhook auth failed");
        return json({ ok: true });
      }
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const admin = createAdminClient();
    const trackingData = payload?.tracking_data as Record<string, unknown> | undefined;
    const awb =
      payload?.awb ||
      payload?.awb_code ||
      trackingData?.awb ||
      payload?.sr_order_id;
    const rawStatus =
      payload?.current_status ||
      payload?.shipment_status ||
      payload?.status ||
      "";

    await admin.from("shiprocket_webhooks").insert({
      payload,
      awb: awb ? String(awb) : null,
      status: String(rawStatus),
      processed: false,
    });

    if (!awb) return json({ ok: true });

    const { data: order } = await admin
      .from("orders")
      .select("*")
      .eq("shiprocket_awb", String(awb))
      .maybeSingle();

    const orderRow = order as Order | null;
    if (!orderRow) return json({ ok: true });

    if (String(rawStatus) === orderRow.shiprocket_last_status) return json({ ok: true });

    const mapped = mapShiprocketStatus(String(rawStatus));
    if (!mapped) return json({ ok: true });

    const patch: Record<string, unknown> = {
      status: mapped,
      shiprocket_last_status: String(rawStatus),
      updated_at: new Date().toISOString(),
    };
    if (mapped === "delivered") patch.delivered_at = new Date().toISOString();
    if (mapped === "shipped" && !orderRow.shipped_at) patch.shipped_at = new Date().toISOString();

    await admin.from("orders").update(patch).eq("id", orderRow.id);

    if (mapped === "shipped") await notifyOrderEvent({ ...orderRow, ...patch }, "order_shipped");
    if (mapped === "delivered") await notifyOrderEvent({ ...orderRow, ...patch }, "order_delivered");

    return json({ ok: true });
  } catch (e: unknown) {
    console.error("shiprocket webhook error", e);
    return json({ ok: true });
  }
}
