"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  min_order?: number | null;
  max_discount?: number | null;
  usage_limit?: number | null;
  expires_at?: string | null;
  active?: boolean | null;
}

interface CouponForm {
  id: string | null;
  code: string;
  type: string;
  value: string;
  min_order: string;
  max_discount: string;
  usage_limit: string;
  expires_at: string;
  active: boolean;
}

const empty: CouponForm = {
  id: null,
  code: "",
  type: "percent",
  value: "",
  min_order: "0",
  max_discount: "",
  usage_limit: "",
  expires_at: "",
  active: true,
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CouponForm>(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setCoupons((data.coupons || []) as Coupon[]);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        code: form.code,
        type: form.type,
        value: Number(form.value),
        min_order: Number(form.min_order || 0),
        max_discount: form.max_discount ? Number(form.max_discount) : null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        expires_at: form.expires_at || null,
        active: form.active,
      };
      if (form.id) body.id = form.id;
      const res = await fetch("/api/admin/coupons", {
        method: form.id ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success("Coupon saved");
      setOpen(false);
      load();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete coupon?")) return;
    try {
      const res = await fetch(`/api/admin/coupons?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast.success("Deleted");
      load();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-coupons">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-[#7C1F30]">Coupons</h1>
          <p className="text-sm text-[#57534E] mt-1">Discount codes</p>
        </div>
        <Button
          data-testid="coupon-create"
          onClick={() => {
            setForm(empty);
            setOpen(true);
          }}
        >
          Add coupon
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-[#57534E]">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#7C1F30]/15 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF3E7] text-left">
              <tr>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Value</th>
                <th className="px-3 py-2">Min order</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-t border-[#7C1F30]/10">
                  <td className="px-3 py-2 font-medium">{c.code}</td>
                  <td className="px-3 py-2">{c.type}</td>
                  <td className="px-3 py-2">{c.value}</td>
                  <td className="px-3 py-2">{c.min_order}</td>
                  <td className="px-3 py-2">
                    <Badge variant={c.active ? "default" : "secondary"}>
                      {c.active ? "Active" : "Off"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`coupon-edit-${c.id}`}
                      onClick={() => {
                        setForm({
                          id: c.id,
                          code: c.code,
                          type: c.type,
                          value: String(c.value),
                          min_order: String(c.min_order ?? 0),
                          max_discount: c.max_discount != null ? String(c.max_discount) : "",
                          usage_limit: c.usage_limit != null ? String(c.usage_limit) : "",
                          expires_at: c.expires_at ? c.expires_at.slice(0, 16) : "",
                          active: c.active !== false,
                        });
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      data-testid={`coupon-delete-${c.id}`}
                      onClick={() => remove(c.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#FAF3E7]">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#7C1F30]">
              {form.id ? "Edit coupon" : "New coupon"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                data-testid="coupon-form-code"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="percent">Percent</option>
                  <option value="flat">Flat</option>
                </select>
              </div>
              <div>
                <Label>Value</Label>
                <Input
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  data-testid="coupon-form-value"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min order</Label>
                <Input
                  type="number"
                  value={form.min_order}
                  onChange={(e) => setForm({ ...form, min_order: e.target.value })}
                />
              </div>
              <div>
                <Label>Max discount</Label>
                <Input
                  type="number"
                  value={form.max_discount}
                  onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Usage limit</Label>
                <Input
                  type="number"
                  value={form.usage_limit}
                  onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                />
              </div>
              <div>
                <Label>Expires</Label>
                <Input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button data-testid="coupon-form-save" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
