import { requireStaff, json, err } from "@/lib/api-auth";
import { slugify } from "@/lib/utils";
import type {
  ColorOption,
  MediaItem,
  ProductDimensions,
  ProductVariant,
  SizeType,
} from "@/types/database";

function productRowFromBody(body: Record<string, unknown>, id: string, slug: string) {
  const variants = (Array.isArray(body.variants) ? body.variants : []) as ProductVariant[];
  const has_variants = Boolean(body.has_variants) || variants.length > 0;
  const stockFromVariants = has_variants
    ? variants.reduce((s, v) => s + Number(v.stock ?? 0), 0)
    : Number(body.stock ?? 0);

  return {
    id,
    slug,
    name: body.name as string,
    category: body.category as string,
    sub_category: (body.sub_category as string) || null,
    price: Number(body.price),
    old_price: body.old_price ? Number(body.old_price) : null,
    image: body.image as string,
    description: (body.description as string) || "",
    stock: stockFromVariants,
    tags: (body.tags as string[]) || [],
    product_tags: (body.product_tags as string[]) || [],
    hsn: (body.hsn as string) || "6304",
    gst_rate: Number(body.gst_rate ?? 5),
    fabric: (body.fabric as string) || null,
    color_options: (body.color_options as ColorOption[]) || [],
    size_options: (body.size_options as string[]) || [],
    dimensions: (body.dimensions as ProductDimensions) || {},
    media: (body.media as MediaItem[]) || [],
    variants,
    size_type: ((body.size_type as SizeType) || "none") as string,
    has_variants,
    low_stock_threshold: Number(body.low_stock_threshold ?? 5),
    saree_length_m: Number(body.saree_length_m ?? 0),
    blouse_piece_included: Boolean(body.blouse_piece_included),
    vendor: (body.vendor as string) || null,
    featured: Boolean(body.featured),
  };
}

export async function GET() {
  const ctx = await requireStaff(["admin", "inventory_manager"]);
  if (ctx.error) return ctx.error;
  const { data, error } = await ctx.admin
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return err(error.message, 500);
  return json({ products: data || [] });
}

export async function POST(request: Request) {
  const ctx = await requireStaff(["admin", "inventory_manager"]);
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as Record<string, unknown>;
  const id = (body.id as string) || `p${Date.now()}`;
  const slug = (body.slug as string) || slugify(String(body.name || ""));
  const row = productRowFromBody(body, id, slug);
  if (!row.name || !row.category || !row.image || row.price == null || Number.isNaN(row.price)) {
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
  const { id, ...rest } = body;
  if (!id) return err("id required");

  if (rest.name && !rest.slug) rest.slug = slugify(String(rest.name));

  if (Array.isArray(rest.variants) || rest.has_variants != null) {
    const variants = (Array.isArray(rest.variants) ? rest.variants : []) as ProductVariant[];
    const has_variants = Boolean(rest.has_variants) || variants.length > 0;
    rest.has_variants = has_variants;
    rest.variants = variants;
    if (has_variants) {
      rest.stock = variants.reduce((s, v) => s + Number(v.stock ?? 0), 0);
    }
  }

  const { data, error } = await ctx.admin
    .from("products")
    .update(rest)
    .eq("id", id as string)
    .select()
    .single();
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
