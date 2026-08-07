import { requireStaff, json, err } from "@/lib/api-auth";

export async function GET(request: Request) {
  const ctx = await requireStaff(["admin", "order_manager"]);
  if (ctx.error) return ctx.error;
  const tab = new URL(request.url).searchParams.get("tab") || "tickets";

  if (tab === "tickets") {
    const { data } = await ctx.admin.from("tickets").select("*").order("updated_at", { ascending: false });
    return json({ tickets: data || [] });
  }
  if (tab === "notifications") {
    const { data } = await ctx.admin.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
    return json({ notifications: data || [] });
  }
  if (tab === "abandoned") {
    const { data } = await ctx.admin.from("abandoned_carts").select("*").order("last_activity", { ascending: false });
    return json({ abandoned: data || [] });
  }
  return err("Unknown tab");
}

export async function PATCH(request: Request) {
  const ctx = await requireStaff(["admin", "order_manager"]);
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as { id?: string; status?: string; reply?: string };
  const { id, status, reply } = body;
  if (!id) return err("id required");

  const { data: ticket } = await ctx.admin.from("tickets").select("*").eq("id", id).maybeSingle();
  if (!ticket) return err("Not found", 404);

  const ticketRow = ticket as { messages?: { from: string; body: string; at: string }[] };
  const messages = [...(ticketRow.messages || [])];
  if (reply) {
    messages.push({ from: "admin", body: reply, at: new Date().toISOString() });
  }
  const updates: Record<string, unknown> = {
    messages,
    updated_at: new Date().toISOString(),
  };
  if (status) updates.status = status;

  const { data, error } = await ctx.admin.from("tickets").update(updates).eq("id", id).select().single();
  if (error) return err(error.message, 500);
  return json({ ticket: data });
}
