"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
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

interface Banner {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  image?: string | null;
  cta_text?: string | null;
  cta_link?: string | null;
  display_order?: number | null;
  active?: boolean | null;
}

interface BannerForm {
  id: string | null;
  title: string;
  subtitle: string;
  image: string;
  cta_text: string;
  cta_link: string;
  display_order: string;
  active: boolean;
}

const empty: BannerForm = {
  id: null,
  title: "",
  subtitle: "",
  image: "",
  cta_text: "",
  cta_link: "",
  display_order: "0",
  active: true,
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BannerForm>(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banners", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setBanners((data.banners || []) as Banner[]);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "banners");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setForm((f) => ({ ...f, image: data.url }));
      toast.success("Uploaded");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        subtitle: form.subtitle,
        image: form.image,
        cta_text: form.cta_text,
        cta_link: form.cta_link,
        display_order: Number(form.display_order || 0),
        active: form.active,
      };
      if (form.id) body.id = form.id;
      const res = await fetch("/api/admin/banners", {
        method: form.id ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success("Banner saved");
      setOpen(false);
      load();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete banner?")) return;
    try {
      const res = await fetch(`/api/admin/banners?id=${encodeURIComponent(id)}`, {
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
    <div className="space-y-6" data-testid="admin-banners">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-[#7C1F30]">Banners</h1>
          <p className="text-sm text-[#57534E] mt-1">Homepage slider</p>
        </div>
        <Button
          data-testid="banner-create"
          onClick={() => {
            setForm(empty);
            setOpen(true);
          }}
        >
          Add banner
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-[#57534E]">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#7C1F30]/15 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF3E7] text-left">
              <tr>
                <th className="px-3 py-2">Preview</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id} className="border-t border-[#7C1F30]/10">
                  <td className="px-3 py-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.image || ""} alt="" className="h-12 w-20 object-cover rounded" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{b.title}</div>
                    <div className="text-xs text-[#57534E]">{b.subtitle}</div>
                  </td>
                  <td className="px-3 py-2">{b.display_order}</td>
                  <td className="px-3 py-2">
                    <Badge variant={b.active ? "default" : "secondary"}>
                      {b.active ? "Active" : "Off"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`banner-edit-${b.id}`}
                      onClick={() => {
                        setForm({
                          id: b.id,
                          title: b.title || "",
                          subtitle: b.subtitle || "",
                          image: b.image || "",
                          cta_text: b.cta_text || "",
                          cta_link: b.cta_link || "",
                          display_order: String(b.display_order ?? 0),
                          active: b.active !== false,
                        });
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      data-testid={`banner-delete-${b.id}`}
                      onClick={() => remove(b.id)}
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
        <DialogContent className="bg-[#FAF3E7] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#7C1F30]">
              {form.id ? "Edit banner" : "New banner"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                data-testid="banner-form-title"
              />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                data-testid="banner-form-image"
              />
              <Input type="file" accept="image/*" className="mt-2" onChange={onUpload} disabled={uploading} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>CTA text</Label>
                <Input
                  value={form.cta_text}
                  onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
                />
              </div>
              <div>
                <Label>CTA link</Label>
                <Input
                  value={form.cta_link}
                  onChange={(e) => setForm({ ...form, cta_link: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Display order</Label>
              <Input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: e.target.value })}
              />
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
            <Button data-testid="banner-form-save" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
