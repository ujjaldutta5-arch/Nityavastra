/**
 * Shiprocket async client for Next.js serverless routes.
 */
let cachedToken: string | null = null;
let tokenExpiry = 0;

const BASE = "https://apiv2.shiprocket.in/v1/external";

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry - 60_000) return cachedToken;
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) throw new Error("Shiprocket credentials not configured");

  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Shiprocket auth failed: ${res.status}`);
  const data = (await res.json()) as { token: string };
  cachedToken = data.token;
  tokenExpiry = Date.now() + 10 * 24 * 60 * 60 * 1000;
  return cachedToken;
}

async function srFetch(
  path: string,
  { method = "GET", body }: { method?: string; body?: unknown } = {}
): Promise<Record<string, unknown>> {
  const token = await getToken();
  let res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    cachedToken = null;
    const token2 = await getToken();
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token2}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg = data?.message || data?.error || `Shiprocket ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

export function isShiprocketConfigured(): boolean {
  return Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
}

export async function getShiprocketStatus() {
  if (!isShiprocketConfigured()) return { configured: false as const };
  try {
    await getToken();
    const pickup = await srFetch("/settings/company/pickup");
    const pickupData = pickup?.data as { shipping_address?: unknown } | undefined;
    return {
      configured: true as const,
      pickup_locations: pickupData?.shipping_address || pickup || [],
    };
  } catch (e) {
    return { configured: true as const, error: (e as Error).message };
  }
}

export async function checkServiceability({
  pickup_postcode,
  delivery_postcode,
  weight = 0.5,
  cod = 0,
}: {
  pickup_postcode: string | number;
  delivery_postcode: string | number;
  weight?: number;
  cod?: number;
}) {
  const qs = new URLSearchParams({
    pickup_postcode: String(pickup_postcode),
    delivery_postcode: String(delivery_postcode),
    weight: String(weight),
    cod: String(cod),
  });
  return srFetch(`/courier/serviceability?${qs}`);
}

export async function checkPincode(pincode: string | number) {
  const pickup = process.env.SHIPROCKET_PICKUP_PINCODE || "751019";
  try {
    const data = await checkServiceability({
      pickup_postcode: pickup,
      delivery_postcode: pincode,
      weight: 0.5,
      cod: 0,
    });
    const nested = data?.data as { available_courier_companies?: Array<Record<string, unknown>> } | undefined;
    const couriers = nested?.available_courier_companies || [];
    if (!couriers.length) return { deliverable: false, message: "Not serviceable" };
    const best = [...couriers].sort(
      (a, b) => Number(a.freight_charge || 0) - Number(b.freight_charge || 0)
    )[0];
    return {
      deliverable: true,
      etd: best.etd || best.estimated_delivery_days,
      courier: best.courier_name,
      rate: best.freight_charge,
    };
  } catch (e) {
    return { deliverable: false, message: (e as Error).message };
  }
}

type ShippingAddress = {
  name?: string;
  line1?: string;
  address?: string;
  line2?: string;
  city?: string;
  pincode?: string;
  state?: string;
  phone?: string;
};

type ShipmentOrder = {
  id: string;
  created_at?: string;
  shipping_address?: ShippingAddress;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  payment_method?: string;
  subtotal?: number;
  [key: string]: unknown;
};

type ShipmentItem = {
  product_name: string;
  variant_sku?: string | null;
  product_id?: string;
  quantity: number;
  unit_price: number;
  hsn?: string | null;
};

export function buildOrderPayload(order: ShipmentOrder, items: ShipmentItem[]) {
  const addr = order.shipping_address || {};
  return {
    order_id: order.id,
    order_date: new Date((order.created_at as string) || Date.now()).toISOString().slice(0, 10),
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Home",
    billing_customer_name: order.customer_name || addr.name || "Customer",
    billing_last_name: "",
    billing_address: addr.line1 || addr.address || "",
    billing_address_2: addr.line2 || "",
    billing_city: addr.city || "",
    billing_pincode: addr.pincode || "",
    billing_state: addr.state || "",
    billing_country: "India",
    billing_email: order.customer_email || "",
    billing_phone: order.customer_phone || addr.phone || "",
    shipping_is_billing: true,
    order_items: items.map((i) => ({
      name: i.product_name,
      sku: i.variant_sku || i.product_id || "SKU",
      units: i.quantity,
      selling_price: i.unit_price,
      hsn: i.hsn || "6304",
    })),
    payment_method: order.payment_method === "cod" ? "COD" : "Prepaid",
    sub_total: order.subtotal,
    length: 30,
    breadth: 20,
    height: 5,
    weight: 0.5,
  };
}

export async function createShipment(order: ShipmentOrder, items: ShipmentItem[]) {
  const payload = buildOrderPayload(order, items);
  const created = await srFetch("/orders/create/adhoc", { method: "POST", body: payload });
  const shiprocketOrderId = created.order_id || created.order_id;
  const assign = await srFetch("/courier/assign/awb", {
    method: "POST",
    body: { shipment_id: created.shipment_id },
  });
  const assignResponse = assign?.response as { data?: Record<string, unknown> } | undefined;
  const awb = (assignResponse?.data?.awb_code || assign?.awb_code) as string | undefined;
  try {
    await srFetch("/courier/generate/pickup", {
      method: "POST",
      body: { shipment_id: [created.shipment_id] },
    });
  } catch {
    /* pickup may already be scheduled */
  }
  let labelUrl: string | null = null;
  try {
    const label = await srFetch("/courier/generate/label", {
      method: "POST",
      body: { shipment_id: [created.shipment_id] },
    });
    const labelResponse = label?.response as { label_url?: string } | undefined;
    labelUrl = (label?.label_url as string) || labelResponse?.label_url || null;
  } catch {
    /* optional */
  }
  return {
    shiprocket_order_id: String(shiprocketOrderId || created.shipment_id),
    shiprocket_awb: awb,
    courier_name: (assignResponse?.data?.courier_name || assign?.courier_name) as string | undefined,
    tracking_url: awb ? `https://shiprocket.co/tracking/${awb}` : null,
    label_url: labelUrl,
    shipment_id: created.shipment_id,
  };
}

export async function trackAwb(awb: string) {
  return srFetch(`/courier/track/awb/${awb}`);
}

export async function cancelShipment(ids: (string | number)[]) {
  return srFetch("/orders/cancel", { method: "POST", body: { ids } });
}

export const STATUS_MAP: Record<string, string> = {
  NEW: "processing",
  PICKUP_SCHEDULED: "processing",
  PICKED_UP: "shipped",
  IN_TRANSIT: "shipped",
  "OUT FOR DELIVERY": "shipped",
  DELIVERED: "delivered",
  RTO_INITIATED: "rto",
  RTO_DELIVERED: "rto",
  CANCELLED: "cancelled",
};

export function mapShiprocketStatus(raw: string | null | undefined): string | null {
  const key = String(raw || "").toUpperCase();
  for (const [k, v] of Object.entries(STATUS_MAP)) {
    if (key.includes(k)) return v;
  }
  return null;
}
