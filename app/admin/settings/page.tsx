"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SettingsForm {
  free_shipping_threshold: string;
  base_shipping_fee: string;
  cod_enabled: boolean;
  cod_pincodes: string;
  razorpay_mode: string;
  razorpay_live_key: string;
  razorpay_live_secret: string;
  whatsapp_number: string;
  seller_name: string;
  seller_gstin: string;
  seller_address: string;
  seller_phone: string;
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SettingsForm>({
    free_shipping_threshold: "999",
    base_shipping_fee: "79",
    cod_enabled: true,
    cod_pincodes: "",
    razorpay_mode: "test",
    razorpay_live_key: "",
    razorpay_live_secret: "",
    whatsapp_number: "",
    seller_name: "",
    seller_gstin: "",
    seller_address: "",
    seller_phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/settings", { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        const s = (data.settings || {}) as Record<string, any>;
        setForm({
          free_shipping_threshold: String(s.free_shipping_threshold ?? 999),
          base_shipping_fee: String(s.base_shipping_fee ?? 79),
          cod_enabled: s.cod_enabled !== false,
          cod_pincodes: Array.isArray(s.cod_pincodes) ? s.cod_pincodes.join(", ") : "",
          razorpay_mode: s.razorpay_mode || "test",
          razorpay_live_key: s.razorpay_live_key || "",
          razorpay_live_secret: s.razorpay_live_secret || "",
          whatsapp_number: s.whatsapp_number || "",
          seller_name: s.seller_name || "",
          seller_gstin: s.seller_gstin || "",
          seller_address: s.seller_address || "",
          seller_phone: s.seller_phone || "",
        });
      } catch (e: unknown) {
        toast.error((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        free_shipping_threshold: Number(form.free_shipping_threshold),
        base_shipping_fee: Number(form.base_shipping_fee),
        cod_enabled: form.cod_enabled,
        cod_pincodes: form.cod_pincodes
          .split(/[,\s]+/)
          .map((p) => p.trim())
          .filter(Boolean),
        razorpay_mode: form.razorpay_mode,
        razorpay_live_key: form.razorpay_live_key || null,
        razorpay_live_secret: form.razorpay_live_secret || null,
        whatsapp_number: form.whatsapp_number,
        seller_name: form.seller_name,
        seller_gstin: form.seller_gstin,
        seller_address: form.seller_address,
        seller_phone: form.seller_phone,
      };
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success("Settings saved");
      if (data.settings?.razorpay_live_secret) {
        setForm((f) => ({
          ...f,
          razorpay_live_secret: data.settings.razorpay_live_secret,
        }));
      }
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-[#57534E]">Loading…</p>;

  return (
    <div className="space-y-6 max-w-2xl" data-testid="admin-settings">
      <div>
        <h1 className="font-serif text-3xl text-[#7C1F30]">Settings</h1>
        <p className="text-sm text-[#57534E] mt-1">Store configuration</p>
      </div>

      <div className="rounded-lg border border-[#7C1F30]/15 bg-white p-4 space-y-4">
        <h2 className="font-serif text-lg text-[#7C1F30]">Shipping & COD</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Free shipping threshold</Label>
            <Input
              type="number"
              value={form.free_shipping_threshold}
              onChange={(e) => setForm({ ...form, free_shipping_threshold: e.target.value })}
              data-testid="settings-free-shipping"
            />
          </div>
          <div>
            <Label>Base shipping fee</Label>
            <Input
              type="number"
              value={form.base_shipping_fee}
              onChange={(e) => setForm({ ...form, base_shipping_fee: e.target.value })}
              data-testid="settings-base-shipping"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.cod_enabled}
            onChange={(e) => setForm({ ...form, cod_enabled: e.target.checked })}
            data-testid="settings-cod-enabled"
          />
          COD enabled
        </label>
        <div>
          <Label>COD pincodes (comma-separated; empty = all)</Label>
          <Textarea
            rows={2}
            value={form.cod_pincodes}
            onChange={(e) => setForm({ ...form, cod_pincodes: e.target.value })}
          />
        </div>
      </div>

      <div className="rounded-lg border border-[#7C1F30]/15 bg-white p-4 space-y-4">
        <h2 className="font-serif text-lg text-[#7C1F30]">Razorpay</h2>
        <div className="flex gap-2" data-testid="settings-razorpay-mode">
          {["test", "live"].map((mode) => (
            <Button
              key={mode}
              type="button"
              size="sm"
              variant={form.razorpay_mode === mode ? "default" : "outline"}
              onClick={() => setForm({ ...form, razorpay_mode: mode })}
            >
              {mode.toUpperCase()}
            </Button>
          ))}
        </div>
        <div>
          <Label>Live key</Label>
          <Input
            value={form.razorpay_live_key}
            onChange={(e) => setForm({ ...form, razorpay_live_key: e.target.value })}
            placeholder="rzp_live_..."
          />
        </div>
        <div>
          <Label>Live secret</Label>
          <Input
            type="password"
            value={form.razorpay_live_secret}
            onChange={(e) => setForm({ ...form, razorpay_live_secret: e.target.value })}
          />
        </div>
      </div>

      <div className="rounded-lg border border-[#7C1F30]/15 bg-white p-4 space-y-4">
        <h2 className="font-serif text-lg text-[#7C1F30]">Seller</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Seller name</Label>
            <Input
              value={form.seller_name}
              onChange={(e) => setForm({ ...form, seller_name: e.target.value })}
            />
          </div>
          <div>
            <Label>GSTIN</Label>
            <Input
              value={form.seller_gstin}
              onChange={(e) => setForm({ ...form, seller_gstin: e.target.value })}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={form.seller_phone}
              onChange={(e) => setForm({ ...form, seller_phone: e.target.value })}
            />
          </div>
          <div>
            <Label>WhatsApp number</Label>
            <Input
              value={form.whatsapp_number}
              onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label>Address</Label>
          <Textarea
            rows={2}
            value={form.seller_address}
            onChange={(e) => setForm({ ...form, seller_address: e.target.value })}
          />
        </div>
      </div>

      <Button data-testid="settings-save" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}
