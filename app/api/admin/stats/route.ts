import { requireStaff, json } from "@/lib/api-auth";
import type { Product } from "@/types";

export async function GET() {
  const ctx = await requireStaff();
  if (ctx.error) return ctx.error;

  const admin = ctx.admin;
  const [{ count: productCount }, { count: orderCount }, { data: orders }, { data: products }] =
    await Promise.all([
      admin.from("products").select("*", { count: "exact", head: true }),
      admin.from("orders").select("*", { count: "exact", head: true }),
      admin
        .from("orders")
        .select("total, payment_status, created_at")
        .in("payment_status", ["paid", "cod_pending", "refunded"]),
      admin
        .from("products")
        .select("id, name, stock, low_stock_threshold, has_variants, variants")
        .order("stock"),
    ]);

  const revenue = ((orders || []) as { payment_status: string; total?: number }[])
    .filter((o) => o.payment_status === "paid" || o.payment_status === "cod_pending")
    .reduce((s, o) => s + Number(o.total || 0), 0);

  const low_stock = ((products || []) as Product[])
    .map((p) => {
      const threshold = Number(p.low_stock_threshold ?? 5);
      const stock = Number(p.stock ?? 0);
      return { id: p.id, name: p.name, stock, threshold };
    })
    .filter((p) => p.stock <= p.threshold)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 20);

  return json({
    products: productCount || 0,
    orders: orderCount || 0,
    revenue,
    low_stock,
  });
}
