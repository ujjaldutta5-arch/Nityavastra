import { requireStaff, json, err } from "@/lib/api-auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  const ctx = await requireStaff(["admin", "inventory_manager"]);
  if (ctx.error) return ctx.error;
  const { data, error } = await ctx.admin.from("products").select("*").order("created_at", { ascending: false });
  if (error) return err(error.message, 500);
  return json({ products: data || [] });
}

export async function POST(request: Request) {
  const ctx = await requireStaff(["admin", "inventory_manager"]);
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as Record<string, unknown>;
  const id = (body.id as string) || `p${Date.now()}`;
  const slug = (body.slug as string) || slugify(String(body.name || ""));
  const row = {
    id,
    slug,
    name: body.name as string,
    category: body.category as string,
    sub_category: (body.sub_category as string) || null,
    price: Number(body.price),
    old_price: body.old_price ? Number(body.old_price) : null,
    image: body.image as string,
    description: (body.description as string) || "",
    stock: Number(body.stock ?? 0),
    tags: (body.tags as string[]) || [],
    product_tags: (body.product_tags as string[]) || [],
    hsn: (body.hsn as string) || "6304",
    gst_rate: Number(body.gst_rate ?? 5),
    fabric: (body.fabric as string) || null,
    color_options: (body.color_options as unknown[]) || [],
    size_options: (body.size_options as unknown[]) || [],
    dimensions: (body.dimensions as Record<string, unknown>) || {},
    media: (body.media as unknown[]) || [],
    vendor: (body.vendor as string) || null,
    featured: Boolean(body.featured),
  };
  if (!row.name || !row.category || !row.image || row.price == null) {
    return err("name, category, price, image required");
  }
  const { data, error } = await ctx.admin.from("products").insert(row).select().single();
  if (error) return err(error.message, 500);
  return json({ product: data }, 201);
}

export async function PATCH(request: Request) {
  const ctx = await requireStaff(["admin", "inventory_manager"]);
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as Record<string, unknown>;
  const { id, ...updates } = body;
  if (!id) return err("id required");
  if (updates.name && !updates.slug) updates.slug = slugify(String(updates.name));
  const { data, error } = await ctx.admin.from("products").update(updates).eq("id", id as string).select().single();
  if (error) return err(error.message, 500);
  return json({ product: data });
}

export async function DELETE(request: Request) {
  const ctx = await requireStaff(["admin", "inventory_manager"]);
  if (ctx.error) return ctx.error;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return err("id required");
  const { error } = await ctx.admin.from("products").delete().eq("id", id);
  if (error) return err(error.message, 500);
  return json({ ok: true });
}
