import { requireStaff, json, err } from "@/lib/api-auth";

export async function GET() {
  const ctx = await requireStaff();
  if (ctx.error) return ctx.error;
  const { data } = await ctx.admin.from("cms_pages").select("*").order("slug");
  return json({ pages: data || [] });
}

export async function POST(request: Request) {
  const ctx = await requireStaff(["admin"]);
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as Record<string, unknown>;
  const { data, error } = await ctx.admin
    .from("cms_pages")
    .insert({ ...body, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) return err(error.message, 500);
  return json({ page: data }, 201);
}

export async function PATCH(request: Request) {
  const ctx = await requireStaff(["admin"]);
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as Record<string, unknown>;
  const { id, ...updates } = body;
  if (!id) return err("id required");
  updates.updated_at = new Date().toISOString();
  const { data, error } = await ctx.admin.from("cms_pages").update(updates).eq("id", id as string).select().single();
  if (error) return err(error.message, 500);
  return json({ page: data });
}
