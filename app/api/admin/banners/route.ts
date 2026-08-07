import { requireStaff, json, err } from "@/lib/api-auth";

export async function GET() {
  const ctx = await requireStaff();
  if (ctx.error) return ctx.error;
  const { data } = await ctx.admin.from("banners").select("*").order("display_order");
  return json({ banners: data || [] });
}

export async function POST(request: Request) {
  const ctx = await requireStaff(["admin", "inventory_manager"]);
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as Record<string, unknown>;
  const { data, error } = await ctx.admin.from("banners").insert(body).select().single();
  if (error) return err(error.message, 500);
  return json({ banner: data }, 201);
}

export async function PATCH(request: Request) {
  const ctx = await requireStaff(["admin", "inventory_manager"]);
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as Record<string, unknown>;
  const { id, ...updates } = body;
  if (!id) return err("id required");
  const { data, error } = await ctx.admin.from("banners").update(updates).eq("id", id as string).select().single();
  if (error) return err(error.message, 500);
  return json({ banner: data });
}

export async function DELETE(request: Request) {
  const ctx = await requireStaff(["admin", "inventory_manager"]);
  if (ctx.error) return ctx.error;
  const id = new URL(request.url).searchParams.get("id");
  await ctx.admin.from("banners").delete().eq("id", id);
  return json({ ok: true });
}
