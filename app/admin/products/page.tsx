"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { formatINR, CATEGORIES } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductMediaDropzone } from "@/components/admin/ProductMediaDropzone";
import { VariantMatrixEditor } from "@/components/admin/VariantMatrixEditor";
import type {
  ColorOption,
  MediaItem,
  Product,
  ProductDimensions,
  ProductVariant,
  SizeType,
} from "@/types";

const PRODUCT_TAG_OPTIONS = [
  { slug: "bestseller", name: "Bestseller" },
  { slug: "new-arrival", name: "New Arrival" },
  { slug: "festive", name: "Festive" },
  { slug: "casual", name: "Casual" },
];

const SUBCATEGORIES: Record<string, string[]> = {
  sarees: ["silk", "cotton", "georgette", "banarasi"],
  "daily-wear": ["kurtis", "nightwear", "co-ords"],
  "home-essentials": ["bedsheets", "curtains", "kitchen-linen"],
};

type ProductForm = {
  id: string | null;
  name: string;
  category: string;
  sub_category: string;
  price: string;
  old_price: string;
  stock: string;
  image: string;
  description: string;
  featured: boolean;
  product_tags: string[];
  fabric: string;
  hsn: string;
  gst_rate: string;
  dimensions: ProductDimensions;
  media: MediaItem[];
  size_type: SizeType;
  size_options: string[];
  color_options: ColorOption[];
  variants: ProductVariant[];
  has_variants: boolean;
  low_stock_threshold: string;
  saree_length_m: string;
  blouse_piece_included: boolean;
};

const emptyForm = (): ProductForm => ({
  id: null,
  name: "",
  category: "sarees",
  sub_category: "",
  price: "",
  old_price: "",
  stock: "0",
  image: "",
  description: "",
  featured: false,
  product_tags: [],
  fabric: "",
  hsn: "6304",
  gst_rate: "5",
  dimensions: { length_cm: 0, width_cm: 0, height_cm: 0, weight_g: 0 },
  media: [],
  size_type: "none",
  size_options: [],
  color_options: [],
  variants: [],
  has_variants: false,
  low_stock_threshold: "5",
  saree_length_m: "0",
  blouse_piece_included: false,
});

interface ImportRow {
  name?: string;
  category?: string;
  price?: string | number;
  image?: string;
  stock?: string | number;
  [key: string]: unknown;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [stockAdjustId, setStockAdjustId] = useState<string | null>(null);
  const [stockDelta, setStockDelta] = useState("0");
  const [stockNote, setStockNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setProducts((data.products || []) as Product[]);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    const dims = (p.dimensions || {}) as ProductDimensions;
    setForm({
      id: p.id,
      name: p.name || "",
      category: p.category || "sarees",
      sub_category: p.sub_category || "",
      price: String(p.price ?? ""),
      old_price: p.old_price != null ? String(p.old_price) : "",
      stock: String(p.stock ?? 0),
      image: p.image || "",
      description: p.description || "",
      featured: Boolean(p.featured),
      product_tags: [...(p.product_tags || [])],
      fabric: p.fabric || "",
      hsn: p.hsn || "6304",
      gst_rate: String(p.gst_rate ?? 5),
      dimensions: {
        length_cm: Number(dims.length_cm || 0),
        width_cm: Number(dims.width_cm || 0),
        height_cm: Number(dims.height_cm || 0),
        weight_g: Number(dims.weight_g || 0),
      },
      media: Array.isArray(p.media) ? [...p.media] : [],
      size_type: (p.size_type as SizeType) || "none",
      size_options: Array.isArray(p.size_options) ? [...p.size_options] : [],
      color_options: Array.isArray(p.color_options) ? [...p.color_options] : [],
      variants: Array.isArray(p.variants) ? [...p.variants] : [],
      has_variants: Boolean(p.has_variants),
      low_stock_threshold: String(p.low_stock_threshold ?? 5),
      saree_length_m: String(p.saree_length_m ?? 0),
      blouse_piece_included: Boolean(p.blouse_piece_included),
    });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const cover =
        form.image ||
        form.media.find((m) => m.kind === "image")?.url ||
        "";
      if (!form.name || !form.category || !cover || !form.price) {
        throw new Error("Name, category, price, and at least one image are required");
      }
      const body: Record<string, unknown> = {
        name: form.name,
        category: form.category,
        sub_category: form.sub_category || null,
        price: Number(form.price),
        old_price: form.old_price ? Number(form.old_price) : null,
        stock: Number(form.stock || 0),
        image: cover,
        description: form.description,
        featured: form.featured,
        product_tags: form.product_tags,
        tags: form.product_tags,
        fabric: form.fabric || null,
        hsn: form.hsn,
        gst_rate: Number(form.gst_rate || 5),
        dimensions: form.dimensions,
        media: form.media,
        size_type: form.size_type,
        size_options: form.size_options,
        color_options: form.color_options,
        variants: form.variants,
        has_variants: form.has_variants || form.variants.length > 0,
        low_stock_threshold: Number(form.low_stock_threshold || 5),
        saree_length_m: Number(form.saree_length_m || 0),
        blouse_piece_included: form.blouse_piece_included,
      };
      if (form.id) body.id = form.id;
      const res = await fetch("/api/admin/products", {
        method: form.id ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success(form.id ? "Product updated" : "Product created");
      setOpen(false);
      load();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
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

  const runStockAdjust = async () => {
    if (!stockAdjustId) return;
    try {
      const res = await fetch("/api/admin/products/stock-adjust", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: stockAdjustId,
          delta: Number(stockDelta),
          note: stockNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Adjust failed");
      toast.success("Stock updated");
      setStockAdjustId(null);
      setStockDelta("0");
      setStockNote("");
      load();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  };

  const parseImportRows = (text: string): ImportRow[] => {
    const trimmed = text.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) return JSON.parse(trimmed) as ImportRow[];
    return trimmed
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        if (line.includes(",")) {
          const [name, category, price, image, stock] = line.split(",").map((s) => s.trim());
          return { name, category, price, image, stock } as ImportRow;
        }
        return null;
      })
      .filter((row): row is ImportRow => Boolean(row));
  };

  const runImport = async () => {
    setImporting(true);
    try {
      const rows = parseImportRows(importText);
      if (!rows.length) throw new Error("No rows to import");
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      toast.success(`Imported ${data.created} products`);
      setImportText("");
      load();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setImporting(false);
    }
  };

  const toggleTag = (slug: string) => {
    setForm((f) => ({
      ...f,
      product_tags: f.product_tags.includes(slug)
        ? f.product_tags.filter((t) => t !== slug)
        : [...f.product_tags, slug],
    }));
  };

  const subs = SUBCATEGORIES[form.category] || [];

  return (
    <div className="space-y-6" data-testid="admin-products">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-[#7C1F30]">Products</h1>
          <p className="text-sm text-[#57534E] mt-1">
            Variants, media gallery, dimensions & inventory
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" data-testid="products-export">
            <a href="/api/admin/products/bulk" download>
              Bulk export
            </a>
          </Button>
          <Button data-testid="products-create" onClick={openCreate}>
            Add product
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[#57534E]">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#7C1F30]/15 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF3E7] text-left">
              <tr>
                <th className="px-3 py-2">Image</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const threshold = Number(p.low_stock_threshold ?? 5);
                const low = Number(p.stock ?? 0) <= threshold;
                return (
                  <tr key={p.id} className="border-t border-[#7C1F30]/10">
                    <td className="px-3 py-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image} alt="" className="h-10 w-10 object-cover rounded" />
                    </td>
                    <td className="px-3 py-2">
                      {p.name}
                      {p.featured && (
                        <Badge className="ml-2" variant="secondary">
                          Featured
                        </Badge>
                      )}
                      {p.has_variants && (
                        <Badge className="ml-2" variant="outline">
                          Variants
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {p.category}
                      {p.sub_category ? ` / ${p.sub_category}` : ""}
                    </td>
                    <td className="px-3 py-2">{formatINR(p.price)}</td>
                    <td className={`px-3 py-2 ${low ? "text-amber-700 font-medium" : ""}`}>
                      {p.stock}
                      {low ? " · low" : ""}
                    </td>
                    <td className="px-3 py-2 space-x-2 whitespace-nowrap">
                      <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setStockAdjustId(p.id);
                          setStockDelta("0");
                        }}
                      >
                        Stock
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => remove(p.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <section className="rounded-lg border border-[#7C1F30]/15 bg-white p-4 space-y-3">
        <h2 className="font-serif text-lg text-[#7C1F30]">Bulk import</h2>
        <p className="text-xs text-[#57534E]">
          Paste JSON array, or CSV lines: name,category,price,image,stock
        </p>
        <Textarea
          rows={5}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          data-testid="products-import-textarea"
        />
        <Button data-testid="products-import" onClick={runImport} disabled={importing}>
          {importing ? "Importing…" : "Import"}
        </Button>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto bg-[#FAF3E7]">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#7C1F30]">
              {form.id ? "Edit product" : "New product"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-testid="product-form-name"
                />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value, sub_category: "" })
                  }
                  data-testid="product-form-category"
                >
                  {CATEGORIES.filter((c) => c.slug !== "all").map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Sub-category</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
                  value={form.sub_category}
                  onChange={(e) => setForm({ ...form, sub_category: e.target.value })}
                >
                  <option value="">—</option>
                  {subs.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Fabric</Label>
                <Input
                  value={form.fabric}
                  onChange={(e) => setForm({ ...form, fabric: e.target.value })}
                  placeholder="Silk / Cotton / …"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  data-testid="product-form-price"
                />
              </div>
              <div>
                <Label>MRP</Label>
                <Input
                  type="number"
                  value={form.old_price}
                  onChange={(e) => setForm({ ...form, old_price: e.target.value })}
                />
              </div>
              <div>
                <Label>Stock (no variants)</Label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  disabled={form.has_variants && form.variants.length > 0}
                  data-testid="product-form-stock"
                />
              </div>
              <div>
                <Label>Low-stock alert</Label>
                <Input
                  type="number"
                  value={form.low_stock_threshold}
                  onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Product tags</Label>
              <div className="flex flex-wrap gap-2">
                {PRODUCT_TAG_OPTIONS.map((t) => (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => toggleTag(t.slug)}
                    className={`rounded-full px-3 py-1 text-xs border ${
                      form.product_tags.includes(t.slug)
                        ? "bg-[#7C1F30] text-white border-[#7C1F30]"
                        : "bg-white border-[#7C1F30]/25 text-[#57534E]"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Media gallery</Label>
              <ProductMediaDropzone
                media={form.media}
                coverUrl={form.image}
                onChange={(media, cover) => setForm({ ...form, media, image: cover })}
              />
              <Input
                className="mt-2"
                placeholder="Or paste cover image URL"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                data-testid="product-form-image"
              />
            </div>

            <div>
              <Label className="mb-2 block">Dimensions & weight</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    ["length_cm", "Length (cm)"],
                    ["width_cm", "Width (cm)"],
                    ["height_cm", "Height (cm)"],
                    ["weight_g", "Weight (g)"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <Label className="text-xs">{label}</Label>
                    <Input
                      type="number"
                      value={form.dimensions[key] ?? 0}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          dimensions: {
                            ...form.dimensions,
                            [key]: Number(e.target.value || 0),
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {form.category === "sarees" && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Saree length (m)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.saree_length_m}
                    onChange={(e) => setForm({ ...form, saree_length_m: e.target.value })}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm mt-6">
                  <input
                    type="checkbox"
                    checked={form.blouse_piece_included}
                    onChange={(e) =>
                      setForm({ ...form, blouse_piece_included: e.target.checked })
                    }
                  />
                  Blouse piece included
                </label>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>HSN</Label>
                <Input
                  value={form.hsn}
                  onChange={(e) => setForm({ ...form, hsn: e.target.value })}
                />
              </div>
              <div>
                <Label>GST %</Label>
                <Input
                  type="number"
                  value={form.gst_rate}
                  onChange={(e) => setForm({ ...form, gst_rate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Variants</Label>
              <VariantMatrixEditor
                productId={form.id || form.name || "NEW"}
                sizeType={form.size_type}
                sizeOptions={form.size_options}
                colorOptions={form.color_options}
                variants={form.variants}
                onChange={(next) =>
                  setForm({
                    ...form,
                    size_type: next.sizeType,
                    size_options: next.sizeOptions,
                    color_options: next.colorOptions,
                    variants: next.variants,
                    has_variants: next.has_variants,
                  })
                }
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />
              Featured on home
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button data-testid="product-form-save" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(stockAdjustId)} onOpenChange={(o) => !o && setStockAdjustId(null)}>
        <DialogContent className="max-w-sm bg-[#FAF3E7]">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#7C1F30]">Adjust stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Delta (+ / −)</Label>
              <Input
                type="number"
                value={stockDelta}
                onChange={(e) => setStockDelta(e.target.value)}
              />
            </div>
            <div>
              <Label>Note</Label>
              <Input value={stockNote} onChange={(e) => setStockNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={runStockAdjust}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
