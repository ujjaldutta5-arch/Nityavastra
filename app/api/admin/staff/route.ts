import { requireStaff, json, err } from "@/lib/api-auth";
import type { StaffRole } from "@/types";

export async function GET() {
  const ctx = await requireStaff(["admin"]);
  if (ctx.error) return ctx.error;
  const { data } = await ctx.admin
    .from("profiles")
    .select("id, name, email, phone, role, banned, created_at")
    .in("role", ["admin", "order_manager", "inventory_manager"])
    .order("created_at");
  return json({ staff: data || [] });
}

export async function POST(request: Request) {
  const ctx = await requireStaff(["admin"]);
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as {
    email?: string;
    password?: string;
    name?: string;
    role?: StaffRole;
  };
  const { email, password, name, role = "order_manager" } = body;
  if (!email || !password) return err("email and password required");

  const { data: created, error } = await ctx.admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  });
  if (error) return err(error.message, 500);

  await ctx.admin.from("profiles").upsert({
    id: created.user.id,
    email,
    name: name || "",
    role,
  });

  return json({ user: { id: created.user.id, email, name, role } }, 201);
}

export async function PATCH(request: Request) {
  const ctx = await requireStaff(["admin"]);
  if (ctx.error) return ctx.error;
  const body = (await request.json()) as { id?: string; role?: StaffRole; banned?: boolean };
  const { id, role, banned } = body;
  if (!id) return err("id required");
  const updates: Record<string, unknown> = {};
  if (role) updates.role = role;
  if (banned !== undefined) updates.banned = banned;
  const { data, error } = await ctx.admin.from("profiles").update(updates).eq("id", id).select().single();
  if (error) return err(error.message, 500);
  return json({ profile: data });
}

export async function DELETE(request: Request) {
  const ctx = await requireStaff(["admin"]);
  if (ctx.error) return ctx.error;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return err("id required");
  if (id === ctx.user.id) return err("Cannot delete yourself");
  await ctx.admin.from("profiles").update({ role: "customer" }).eq("id", id);
  return json({ ok: true });
}
