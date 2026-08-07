import { checkPincode, isShiprocketConfigured } from "@/lib/shiprocket";
import { json, err } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const pincode = new URL(request.url).searchParams.get("pincode");
  if (!pincode || !/^\d{6}$/.test(pincode)) return err("Valid 6-digit pincode required");

  if (isShiprocketConfigured()) {
    const result = await checkPincode(pincode);
    return json(result);
  }

  // Fallback: COD pincode list or always deliverable
  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("store_settings")
    .select("cod_pincodes, base_shipping_fee")
    .eq("id", "default")
    .maybeSingle();
  const settingsRow = settings as { cod_pincodes?: string[]; base_shipping_fee?: number } | null;
  const list = settingsRow?.cod_pincodes || [];
  if (list.length && !list.includes(pincode)) {
    return json({ deliverable: false, message: "Not deliverable to this pincode" });
  }
  return json({
    deliverable: true,
    etd: "5-7 days",
    courier: "Standard",
    rate: settingsRow?.base_shipping_fee ?? 79,
  });
}
