import crypto from "crypto";
import Razorpay from "razorpay";
import { createAdminClient } from "@/lib/supabase/admin";

export type RazorpayConfig = {
  mode: "live" | "test";
  key_id: string;
  key_secret: string;
};

export async function getRazorpayConfig(): Promise<RazorpayConfig> {
  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("store_settings")
    .select("razorpay_mode, razorpay_live_key, razorpay_live_secret")
    .eq("id", "default")
    .maybeSingle();

  const mode = (settings?.razorpay_mode as string) || "test";
  if (mode === "live" && settings?.razorpay_live_key && settings?.razorpay_live_secret) {
    return {
      mode: "live",
      key_id: settings.razorpay_live_key as string,
      key_secret: settings.razorpay_live_secret as string,
    };
  }
  return {
    mode: "test",
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "",
  };
}

export async function getRazorpayClient(): Promise<{ client: Razorpay; cfg: RazorpayConfig }> {
  const cfg = await getRazorpayConfig();
  if (!cfg.key_id || !cfg.key_secret) {
    throw new Error("Razorpay keys not configured");
  }
  return { client: new Razorpay({ key_id: cfg.key_id, key_secret: cfg.key_secret }), cfg };
}

export function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
  secret,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret: string;
}): boolean {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === signature;
}

export type GstLineItem = {
  unit_price: number | string;
  quantity: number | string;
  gst_rate?: number | string | null;
};

export function calcGst({
  items,
  shippingFee = 0,
  discount = 0,
  interstate = false,
}: {
  items: GstLineItem[];
  shippingFee?: number;
  discount?: number;
  interstate?: boolean;
}) {
  const subtotal = items.reduce((s, i) => s + Number(i.unit_price) * Number(i.quantity), 0);
  const taxable = Math.max(0, subtotal - discount);
  const avgRate =
    items.length === 0
      ? 5
      : items.reduce((s, i) => s + Number(i.gst_rate || 5) * Number(i.quantity), 0) /
        items.reduce((s, i) => s + Number(i.quantity), 0);
  const tax = (taxable * avgRate) / 100;
  const tax_cgst = interstate ? 0 : tax / 2;
  const tax_sgst = interstate ? 0 : tax / 2;
  const tax_igst = interstate ? tax : 0;
  const total = taxable + tax + Number(shippingFee);
  return {
    subtotal,
    taxable_amount: taxable,
    tax_cgst,
    tax_sgst,
    tax_igst,
    shipping_fee: Number(shippingFee),
    discount: Number(discount),
    total,
  };
}
