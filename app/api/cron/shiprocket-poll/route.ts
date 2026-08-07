import { createAdminClient } from "@/lib/supabase/admin";
import { isShiprocketConfigured, trackAwb, mapShiprocketStatus } from "@/lib/shiprocket";
import { notifyOrderEvent } from "@/lib/notifications";
import { json } from "@/lib/api-auth";
import type { Order } from "@/types";

type TrackResult = {
  tracking_data?: { track_status?: unknown; shipment_status?: unknown };
  status?: unknown;
};

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow when CRON_SECRET unset (dev)
    if (process.env.CRON_SECRET) return json({ error: "Unauthorized" }, 401);
  }

  if (!isShiprocketConfigured()) return json({ skipped: true });

  const admin = createAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select("*")
    .not("shiprocket_awb", "is", null)
    .not("status", "in", '("delivered","cancelled","rto","refunded")');

  let updated = 0;
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
        await admin.from("orders").update(patch).eq("id", order.id);
        if (mapped === "delivered") await notifyOrderEvent({ ...order, ...patch }, "order_delivered");
        updated += 1;
      }
    } catch (e: unknown) {
      console.error("poll error", order.id, (e as Error).message);
    }
  }
  return json({ checked: (orders || []).length, updated });
}
