import { requireStaff, json } from "@/lib/api-auth";

export async function GET() {
  const ctx = await requireStaff();
  if (ctx.error) return ctx.error;

  const admin = ctx.admin;
  const [{ count: productCount }, { count: orderCount }, { data: orders }, { data: lowStock }] =
    await Promise.all([
      admin.from("products").select("*", { count: "exact", head: true }),
      admin.from("orders").select("*", { count: "exact", head: true }),
      admin
        .from("orders")
        .select("total, payment_status, created_at")
        .in("payment_status", ["paid", "cod_pending", "refunded"]),
      admin.from("products").select("id, name, stock").lte("stock", 5).order("stock"),
    ]);

  const revenue = ((orders || []) as { payment_status: string; total?: number }[])
    .filter((o) => o.payment_status === "paid" || o.payment_status === "cod_pending")
    .reduce((s, o) => s + Number(o.total || 0), 0);

  return json({
    products: productCount || 0,
    orders: orderCount || 0,
    revenue,
    low_stock: lowStock || [],
  });
}
