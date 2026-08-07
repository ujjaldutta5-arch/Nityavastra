import { requireStaff, json } from "@/lib/api-auth";
import type { Order } from "@/types";

type OrderItem = {
  product_id?: string;
  product_name?: string;
  quantity: number;
  line_total?: number;
};

type OrderWithItems = Order & {
  created_at?: string;
  tax_cgst?: number;
  tax_sgst?: number;
  tax_igst?: number;
  taxable_amount?: number;
  order_items?: OrderItem[];
};

type SellerAgg = { product_id?: string; name?: string; qty: number; revenue: number };

export async function GET(request: Request) {
  const ctx = await requireStaff(["admin"]);
  if (ctx.error) return ctx.error;

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start_date");
  const end = searchParams.get("end_date");
  const category = searchParams.get("category");
  const csv = searchParams.get("format") === "csv";

  const q = ctx.admin.from("orders").select("*, order_items(*)").in("payment_status", ["paid", "cod_pending", "refunded"]);
  const { data: orders } = await q;
  let rows = (orders || []) as OrderWithItems[];
  if (start) rows = rows.filter((o) => new Date(o.created_at || 0) >= new Date(start));
  if (end) rows = rows.filter((o) => new Date(o.created_at || 0) <= new Date(end));
  if (category) {
    rows = rows.filter((o) => (o.order_items || []).some(async () => false));
    // filter by fetching product categories
    const productIds = new Set<string>();
    rows.forEach((o) =>
      (o.order_items || []).forEach((i) => i.product_id && productIds.add(i.product_id))
    );
    const { data: products } = await ctx.admin.from("products").select("id, category").in("id", [...productIds]);
    const catMap = Object.fromEntries(
      ((products || []) as { id: string; category: string }[]).map((p) => [p.id, p.category])
    );
    rows = rows.filter((o) => (o.order_items || []).some((i) => catMap[i.product_id || ""] === category));
  }

  const paid = rows.filter((o) => o.payment_status !== "refunded");
  const total_revenue = paid.reduce((s, o) => s + Number(o.total || 0), 0);
  const order_count = paid.length;
  const aov = order_count ? total_revenue / order_count : 0;
  const gst = {
    cgst: paid.reduce((s, o) => s + Number(o.tax_cgst || 0), 0),
    sgst: paid.reduce((s, o) => s + Number(o.tax_sgst || 0), 0),
    igst: paid.reduce((s, o) => s + Number(o.tax_igst || 0), 0),
    taxable: paid.reduce((s, o) => s + Number(o.taxable_amount || 0), 0),
  };

  const sellerMap: Record<string, SellerAgg> = {};
  paid.forEach((o) => {
    (o.order_items || []).forEach((i) => {
      const key = i.product_id || i.product_name || "unknown";
      if (!sellerMap[key]) sellerMap[key] = { product_id: i.product_id, name: i.product_name, qty: 0, revenue: 0 };
      sellerMap[key].qty += i.quantity;
      sellerMap[key].revenue += Number(i.line_total || 0);
    });
  });
  const best_sellers = Object.values(sellerMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  const refunds = rows.filter((o) => o.payment_status === "refunded").length;
  const return_rate = order_count ? (refunds / (order_count + refunds)) * 100 : 0;

  const report = {
    total_revenue,
    orders: order_count,
    aov,
    gst,
    best_sellers,
    refund_count: refunds,
    return_rate,
  };

  if (csv) {
    const lines = ["order_id,date,total,payment_status,status"];
    rows.forEach((o) => {
      lines.push(`${o.id},${o.created_at},${o.total},${o.payment_status},${o.status}`);
    });
    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="sales-report.csv"',
      },
    });
  }

  return json(report);
}
