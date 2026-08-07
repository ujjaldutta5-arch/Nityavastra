import { requireUser, json, err } from "@/lib/api-auth";
import { isStaff } from "@/lib/utils";
import type { Order } from "@/types";

function invoiceNumberFromOrder(order: Order): string {
  const existing = order.invoice_number;
  if (typeof existing === "string" && existing) return existing;
  const created = order.created_at ? new Date(String(order.created_at)) : new Date();
  const ymd = created.toISOString().slice(0, 10).replace(/-/g, "");
  const tail = String(order.id || "").replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase() || "ORDER";
  return `NV-${ymd}-${tail}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;

  const { id } = await params;
  if (!id) return err("Order id required", 400);

  const { data: order, error } = await ctx.admin
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) return err(error.message, 500);
  if (!order) return err("Order not found", 404);

  const orderRow = order as Order & { order_items?: unknown[]; user_id?: string };
  const role = ctx.profile?.role || "customer";
  const isOwner = orderRow.user_id === ctx.user.id;
  if (!isOwner && !isStaff(role)) {
    return err("Order not found", 404);
  }

  const paymentStatus = String(orderRow.payment_status || "");
  const invoiceAllowed =
    paymentStatus === "paid" || paymentStatus === "cod_pending" || paymentStatus === "refunded";
  if (!invoiceAllowed) {
    return err("Invoice available only after payment is confirmed", 400);
  }

  const { data: settings } = await ctx.admin
    .from("store_settings")
    .select("seller_name, seller_gstin, seller_address, seller_phone")
    .eq("id", "default")
    .maybeSingle();

  const s = (settings || {}) as {
    seller_name?: string | null;
    seller_gstin?: string | null;
    seller_address?: string | null;
    seller_phone?: string | null;
  };

  const shipping = (orderRow.shipping_address || {}) as Record<string, unknown>;
  const normalizedAddress = {
    name: (shipping.name as string) || orderRow.customer_name || "",
    phone: (shipping.phone as string) || orderRow.customer_phone || "",
    address: (shipping.address as string) || (shipping.line1 as string) || "",
    line1: (shipping.line1 as string) || (shipping.address as string) || "",
    city: (shipping.city as string) || "",
    state: (shipping.state as string) || "",
    pincode: (shipping.pincode as string) || "",
  };

  const items = (orderRow.order_items || []) as Array<Record<string, unknown>>;

  return json({
    order: {
      ...orderRow,
      invoice_number: invoiceNumberFromOrder(orderRow),
      shipping_address: normalizedAddress,
      items,
      order_items: items,
    },
    seller: {
      name: s.seller_name || process.env.SELLER_NAME || "Nityavastra",
      gstin: s.seller_gstin || process.env.SELLER_GSTIN || "—",
      address: s.seller_address || process.env.SELLER_ADDRESS || "Bhubaneswar, Odisha 751019",
      email: process.env.SELLER_EMAIL || "hello@nityavastra.com",
      phone: s.seller_phone || process.env.SELLER_PHONE || "+91 87777 87700",
      state: process.env.SELLER_STATE || "Odisha",
    },
  });
}
