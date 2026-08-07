import { createAdminClient } from "@/lib/supabase/admin";
import { json, err } from "@/lib/api-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { code?: string; subtotal?: number };
  const code = String(body.code || "").toUpperCase();
  const subtotal = Number(body.subtotal || 0);
  if (!code) return err("code required");

  const admin = createAdminClient();
  const { data: coupon } = await admin.from("coupons").select("*").eq("code", code).eq("active", true).maybeSingle();
  if (!coupon) return err("Invalid coupon");
  const c = coupon as {
    code: string;
    type: string;
    value: number;
    min_order?: number;
    max_discount?: number | null;
    expires_at?: string | null;
    usage_limit?: number | null;
    used_count?: number;
  };
  if (c.expires_at && new Date(c.expires_at) < new Date()) return err("Coupon expired");
  if (subtotal < Number(c.min_order || 0)) return err(`Minimum order ₹${c.min_order}`);
  if (c.usage_limit && (c.used_count ?? 0) >= c.usage_limit) return err("Coupon usage limit reached");

  let discount = 0;
  if (c.type === "percent") {
    discount = (subtotal * Number(c.value)) / 100;
    if (c.max_discount) discount = Math.min(discount, Number(c.max_discount));
  } else {
    discount = Number(c.value);
  }
  return json({ code: c.code, discount, type: c.type, value: c.value });
}
