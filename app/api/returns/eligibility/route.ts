import { requireUser, json, err } from "@/lib/api-auth";
import type { Order } from "@/types";

export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get("order_id");
  if (!orderId) return err("order_id required");
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;

  const { data: order } = await ctx.admin.from("orders").select("*").eq("id", orderId).maybeSingle();
  const orderRow = order as Order | null;
  if (!orderRow || orderRow.user_id !== ctx.user.id) return json({ eligible: false });

  if (!["shipped", "delivered"].includes(orderRow.status)) return json({ eligible: false, reason: "status" });

  const anchor = new Date(
    (orderRow.delivered_at as string) ||
      (orderRow.shipped_at as string) ||
      (orderRow.updated_at as string)
  );
  const days = (Date.now() - anchor.getTime()) / (86400 * 1000);
  if (days > 7) return json({ eligible: false, reason: "window" });

  const { data: existing } = await ctx.admin.from("returns").select("id").eq("order_id", orderId).maybeSingle();
  if (existing) return json({ eligible: false, reason: "exists" });

  return json({ eligible: true });
}
