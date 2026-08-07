"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatINR } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { Product, RazorpayOptions, RazorpaySuccessResponse } from "@/types";

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type CheckoutResponse = {
  method?: string;
  order: { id: string };
  razorpay?: {
    key_id?: string;
    amount?: number;
    currency?: string;
    order_id?: string;
  };
};

export default function CheckoutPage() {
  const { items, cartTotal, refreshCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: f.name || user.name || "",
        phone: f.phone || user.phone || "",
        email: f.email || user.email || "",
      }));
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 md:py-24 text-center">
        <p className="mb-4">Please login to checkout.</p>
        <Button onClick={() => router.push("/login")} data-testid="checkout-login-btn">
          Login
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 md:py-24 text-center">
        <p className="mb-4">Your cart is empty.</p>
        <Button onClick={() => router.push("/shop")}>Shop Now</Button>
      </div>
    );
  }

  const shipping = cartTotal > 999 ? 0 : 99;
  const total = Math.max(0, cartTotal + shipping - discount);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const res = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon.trim(), subtotal: cartTotal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid coupon");
      setDiscount(data.discount || 0);
      toast.success(`Coupon applied — saved ${formatINR(data.discount || 0)}`);
    } catch (e: unknown) {
      setDiscount(0);
      const message = e instanceof Error ? e.message : "Invalid coupon";
      toast.error(message);
    }
  };

  const addressPayload = () => ({
    name: form.name,
    phone: form.phone,
    email: form.email,
    line1: form.address,
    address: form.address,
    city: form.city,
    state: form.state,
    pincode: form.pincode,
  });

  const validate = () => {
    if (!form.name || !form.phone || !form.address || !form.city || !form.pincode) {
      toast.error("Please fill in all address fields");
      return false;
    }
    return true;
  };

  const createCheckout = async (payment_method: string): Promise<CheckoutResponse | null> => {
    if (!validate()) return null;
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shipping_address: addressPayload(),
        payment_method,
        coupon_code: coupon.trim() || null,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Checkout failed");
    return data as CheckoutResponse;
  };

  const payCOD = async () => {
    setLoading(true);
    try {
      const data = await createCheckout("cod");
      if (!data) return;
      await refreshCart();
      toast.success("Order placed with Cash on Delivery");
      router.push(`/payment/success?order=${data.order?.id || ""}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not place COD order";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const payRazorpay = async () => {
    setLoading(true);
    try {
      const data = await createCheckout("razorpay");
      if (!data) return;

      if (data.method === "mock") {
        // Only works when server has ALLOW_MOCK_PAY=true — never silent in production
        const verify = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: data.order.id, mock: true }),
        });
        if (!verify.ok) {
          const v = await verify.json().catch(() => ({}));
          throw new Error(
            (v as { error?: string }).error ||
              "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local."
          );
        }
        await refreshCart();
        toast.success("Order placed (mock pay — local only)");
        router.push(`/payment/success?order=${data.order.id}`);
        return;
      }

      if (!data.razorpay?.key_id || !data.razorpay?.order_id) {
        throw new Error(
          "Razorpay checkout did not start. Check RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in .env.local."
        );
      }

      const ok = await loadRazorpay();
      if (!ok) throw new Error("Razorpay failed to load");

      const keyId = data.razorpay.key_id;
      const orderIdRzp = data.razorpay.order_id;
      const options: RazorpayOptions = {
        key: keyId,
        amount: data.razorpay.amount || 0,
        currency: data.razorpay.currency || "INR",
        name: "Nityavastra",
        description: `Order ${data.order.id}`,
        order_id: orderIdRzp,
        handler: async (response: RazorpaySuccessResponse) => {
          const verify = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_id: data.order.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          if (!verify.ok) {
            toast.error("Payment verification failed");
            router.push("/payment/cancel");
            return;
          }
          await refreshCart();
          toast.success("Payment successful");
          router.push(`/payment/success?order=${data.order.id}`);
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#7C1F30" },
        modal: {
          ondismiss: () => {
            setLoading(false);
            router.push("/payment/cancel");
          },
        },
      };

      const checkout = new window.Razorpay(options);
      checkout.open();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Payment failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 md:py-16">
      <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#2A1508] mb-8 md:mb-10">
        Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#E7E5E4] rounded-lg p-6">
            <h2 className="font-serif text-xl mb-6">Shipping Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Full Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-testid="ship-name"
                  className="bg-white"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  data-testid="ship-phone"
                  className="bg-white"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  data-testid="ship-email"
                  className="bg-white"
                />
              </div>
              <div>
                <Label>Pincode</Label>
                <Input
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  data-testid="ship-pincode"
                  className="bg-white"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  data-testid="ship-address"
                  className="bg-white"
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  data-testid="ship-city"
                  className="bg-white"
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  data-testid="ship-state"
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E7E5E4] rounded-lg p-6">
            <h2 className="font-serif text-xl mb-4">Coupon</h2>
            <div className="flex gap-2">
              <Input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="Enter code"
                data-testid="coupon-input"
                className="bg-white"
              />
              <Button
                type="button"
                variant="outline"
                onClick={applyCoupon}
                data-testid="coupon-apply-btn"
              >
                Apply
              </Button>
            </div>
          </div>

          <div className="bg-white border border-[#E7E5E4] rounded-lg p-6">
            <h2 className="font-serif text-xl mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#7C1F30]" />
              Payment
            </h2>
            <p className="text-sm text-[#78716C] mb-4">
              Pay securely with Razorpay (UPI / Cards / NetBanking) or choose Cash on Delivery.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                disabled={loading}
                onClick={payRazorpay}
                data-testid="pay-razorpay-btn"
                className="flex-1 bg-[#7C1F30] hover:bg-[#8D2A3D] text-white rounded-full py-6 uppercase text-xs tracking-[0.2em]"
              >
                {loading ? "Processing..." : `Pay with Razorpay · ${formatINR(total)}`}
              </Button>
              <Button
                type="button"
                disabled={loading}
                variant="outline"
                onClick={payCOD}
                data-testid="pay-cod-btn"
                className="flex-1 rounded-full py-6 uppercase text-xs tracking-[0.2em] border-[#2A1508]"
              >
                Cash on Delivery
              </Button>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="bg-white border border-[#E7E5E4] rounded-lg p-6 sticky top-28">
            <h2 className="font-serif text-xl mb-6">Order Summary</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto mb-6 pr-2">
              {items.map((i) => {
                const product = (i.product || {}) as Partial<Product>;
                const price = product.price || i.unit_price || 0;
                return (
                  <div key={i.product_id} className="flex gap-3 text-sm">
                    <div className="relative w-12 h-16 shrink-0">
                      {product.image && (
                        <Image
                          src={product.image}
                          alt=""
                          fill
                          className="object-cover rounded"
                          sizes="48px"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="line-clamp-1">{product.name}</p>
                      <p className="text-xs text-[#78716C]">Qty: {i.quantity}</p>
                    </div>
                    <div>{formatINR(price * i.quantity)}</div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2 text-sm border-t border-[#E7E5E4] pt-4">
              <div className="flex justify-between">
                <span className="text-[#78716C]">Subtotal</span>
                <span>{formatINR(cartTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Shipping</span>
                <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount</span>
                  <span>-{formatINR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-[#E7E5E4] font-medium text-base">
                <span>Total</span>
                <span data-testid="checkout-total">{formatINR(total)}</span>
              </div>
            </div>
            <Link
              href="/cart"
              className="block text-center text-sm text-[#78716C] hover:text-[#7C1F30] mt-4"
            >
              Edit cart
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
