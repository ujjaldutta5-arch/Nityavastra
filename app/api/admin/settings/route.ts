import { requireStaff, json, err } from "@/lib/api-auth";

export async function GET() {
  const ctx = await requireStaff();
  if (ctx.error) return ctx.error;
  const { data } = await ctx.admin.from("store_settings").select("*").eq("id", "default").maybeSingle();
  // Never expose live secret to non-admin fully — mask
  const settings = data as { razorpay_live_secret?: string | null } | null;
  if (settings?.razorpay_live_secret) {
    settings.razorpay_live_secret = settings.razorpay_live_secret ? "••••••••" : null;
  }
  return json({ settings: data });
}

export async function PATCH(request: Request) {
  const ctx = await requireStaff(["admin"]);
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as Record<string, unknown>;
  delete body.id;
  if (body.razorpay_live_secret === "••••••••") delete body.razorpay_live_secret;
  body.updated_at = new Date().toISOString();
  const { data, error } = await ctx.admin
    .from("store_settings")
    .upsert({ id: "default", ...body })
    .select()
    .single();
  if (error) return err(error.message, 500);
  return json({ settings: data });
}
