import { requireStaff, json, err } from "@/lib/api-auth";
import { slugify } from "@/lib/utils";
import type { Product } from "@/types";

export async function GET() {
  const ctx = await requireStaff(["admin", "inventory_manager"]);
  if (ctx.error) return ctx.error;
  const { data } = await ctx.admin.from("products").select("*").order("created_at", { ascending: false });
  const header = [
    "id",
    "slug",
    "name",
    "category",
    "sub_category",
    "price",
    "old_price",
    "stock",
    "hsn",
    "vendor",
    "featured",
    "description",
    "image",
    "fabric",
    "product_tags",
  ];
  const lines = [header.join(",")];
  for (const p of (data || []) as Product[]) {
    lines.push(
      [
        p.id,
        p.slug,
        JSON.stringify(p.name || ""),
        p.category,
        p.sub_category || "",
        p.price,
        p.old_price || "",
        p.stock,
        p.hsn || "",
        p.vendor || "",
        p.featured,
        JSON.stringify(p.description || ""),
        p.image,
        p.fabric || "",
        JSON.stringify((p.product_tags || []).join("|")),
      ].join(",")
    );
  }
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="products-export.csv"',
    },
  });
}

export async function POST(request: Request) {
  const ctx = await requireStaff(["admin", "inventory_manager"]);
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as { rows?: Record<string, unknown>[] };
  const rows = body.rows || [];
  if (!Array.isArray(rows) || !rows.length) return err("rows required");

  let created = 0;
  for (const r of rows) {
    const id = (r.id as string) || `p${Date.now()}${created}`;
    const row = {
      id,
      slug: (r.slug as string) || slugify(String(r.name || "")),
      name: r.name as string,
      category: r.category as string,
      sub_category: (r.sub_category as string) || null,
      price: Number(r.price),
      old_price: r.old_price ? Number(r.old_price) : null,
      image: r.image as string,
      description: (r.description as string) || "",
      stock: Number(r.stock || 0),
      hsn: (r.hsn as string) || "6304",
      vendor: (r.vendor as string) || null,
      featured: String(r.featured) === "true" || r.featured === true,
      fabric: (r.fabric as string) || null,
      product_tags:
        typeof r.product_tags === "string"
          ? r.product_tags.split("|").filter(Boolean)
          : (r.product_tags as string[]) || [],
      tags: [] as string[],
    };
    if (!row.name || !row.category || !row.image) continue;
    const { error } = await ctx.admin.from("products").upsert(row);
    if (!error) created += 1;
  }
  return json({ created });
}
