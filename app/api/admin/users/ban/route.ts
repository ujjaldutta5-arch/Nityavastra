import { requireStaff, json, err } from "@/lib/api-auth";

export async function POST(request: Request) {
  const ctx = await requireStaff(["admin"]);
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as { user_id?: string; banned?: boolean };
  const { user_id, banned = true } = body;
  if (!user_id) return err("user_id required");
  const { data: profile } = await ctx.admin.from("profiles").select("role").eq("id", user_id).maybeSingle();
  const profileRow = profile as { role?: string } | null;
  if (profileRow && ["admin", "order_manager", "inventory_manager"].includes(profileRow.role || "")) {
    return err("Cannot ban staff");
  }
  const { data, error } = await ctx.admin
    .from("profiles")
    .update({ banned })
    .eq("id", user_id)
    .select()
    .single();
  if (error) return err(error.message, 500);
  return json({ profile: data });
}
