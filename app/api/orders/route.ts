import { requireUser, json, err } from "@/lib/api-auth";

export async function GET() {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;

  const { data: orders, error } = await ctx.admin
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", ctx.user.id)
    .order("created_at", { ascending: false });

  if (error) return err(error.message, 500);
  return json({ orders: orders || [] });
}
