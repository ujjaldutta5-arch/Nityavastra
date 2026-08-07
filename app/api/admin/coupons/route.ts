import { requireStaff, json, err } from "@/lib/api-auth";

export async function GET() {
  const ctx = await requireStaff(["admin", "inventory_manager"]);
  if (ctx.error) return ctx.error;
  const { data } = await ctx.admin.from("coupons").select("*").order("created_at", { ascending: false });
  return json({ coupons: data || [] });
}

export async function POST(request: Request) {
  const ctx = await requireStaff(["admin", "inventory_manager"]);
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as Record<string, unknown>;
  const row = {
    code: String(body.code || "").toUpperCase(),
    type: (body.type as string) || "percent",
    value: Number(body.value),
    min_order: Number(body.min_order || 0),
    max_discount: body.max_discount != null ? Number(body.max_discount) : null,
    active: body.active !== false,
    usage_limit: body.usage_limit != null ? Number(body.usage_limit) : null,
    expires_at: (body.expires_at as string) || null,
  };
  if (!row.code || !row.value) return err("code and value required");
  const { data, error } = await ctx.admin.from("coupons").insert(row).select().single();
  if (error) return err(error.message, 500);
  return json({ coupon: data }, 201);
}

export async function PATCH(request: Request) {
  const ctx = await requireStaff(["admin", "inventory_manager"]);
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as Record<string, unknown>;
  const { id, ...updates } = body;
  if (!id) return err("id required");
  if (updates.code) updates.code = String(updates.code).toUpperCase();
  const { data, error } = await ctx.admin.from("coupons").update(updates).eq("id", id as string).select().single();
  if (error) return err(error.message, 500);
  return json({ coupon: data });
}

export async function DELETE(request: Request) {
  const ctx = await requireStaff(["admin", "inventory_manager"]);
  if (ctx.error) return ctx.error;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return err("id required");
  await ctx.admin.from("coupons").delete().eq("id", id);
  return json({ ok: true });
}
