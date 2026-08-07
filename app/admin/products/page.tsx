"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
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
import type { Product } from "@/types";

interface ProductForm {
  id: string | null;
  name: string;
  category: string;
  price: string;
  old_price: string;
  stock: string;
  image: string;
  description: string;
  featured: boolean;
  tags: string;
}

interface ImportRow {
  name?: string;
  category?: string;
  price?: string | number;
  image?: string;
  stock?: string | number;
  [key: string]: unknown;
}

const emptyForm: ProductForm = {
  id: null,
  name: "",
  category: "sarees",
  price: "",
  old_price: "",
  stock: "0",
  image: "",
  description: "",
  featured: false,
  tags: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      id: p.id,
      name: p.name || "",
      category: p.category || "sarees",
      price: String(p.price ?? ""),
      old_price: p.old_price != null ? String(p.old_price) : "",
      stock: String(p.stock ?? 0),
      image: p.image || "",
      description: p.description || "",
      featured: Boolean(p.featured),
      tags: (p.product_tags || p.tags || []).join(", "),
    });
    setOpen(true);
  };

  const onUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "products");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setForm((f) => ({ ...f, image: data.url }));
      toast.success("Image uploaded");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const body: Record<string, unknown> = {
        name: form.name,
        category: form.category,
        price: Number(form.price),
        old_price: form.old_price ? Number(form.old_price) : null,
        stock: Number(form.stock || 0),
        image: form.image,
        description: form.description,
        featured: form.featured,
        product_tags: tags,
        tags,
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

  return (
    <div className="space-y-6" data-testid="admin-products">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-[#7C1F30]">Products</h1>
          <p className="text-sm text-[#57534E] mt-1">Manage catalog inventory</p>
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
              {products.map((p) => (
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
                  </td>
                  <td className="px-3 py-2">{p.category}</td>
                  <td className="px-3 py-2">{formatINR(p.price)}</td>
                  <td className="px-3 py-2">{p.stock}</td>
                  <td className="px-3 py-2 space-x-2 whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`product-edit-${p.id}`}
                      onClick={() => openEdit(p)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      data-testid={`product-delete-${p.id}`}
                      onClick={() => remove(p.id)}
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

      <section className="rounded-lg border border-[#7C1F30]/15 bg-white p-4 space-y-3">
        <h2 className="font-serif text-lg text-[#7C1F30]">Bulk import</h2>
        <p className="text-xs text-[#57534E]">
          Paste JSON array of rows, or CSV lines: name,category,price,image,stock
        </p>
        <Textarea
          rows={5}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder='[{"name":"Silk Saree","category":"sarees","price":2999,"image":"https://...","stock":10}]'
          data-testid="products-import-textarea"
        />
        <Button data-testid="products-import" onClick={runImport} disabled={importing}>
          {importing ? "Importing…" : "Import"}
        </Button>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[#FAF3E7]">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#7C1F30]">
              {form.id ? "Edit product" : "New product"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                data-testid="product-form-name"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                data-testid="product-form-category"
              >
                {CATEGORIES.filter((c) => c.slug !== "all").map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  data-testid="product-form-price"
                />
              </div>
              <div>
                <Label htmlFor="old_price">Old price</Label>
                <Input
                  id="old_price"
                  type="number"
                  value={form.old_price}
                  onChange={(e) => setForm({ ...form, old_price: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                data-testid="product-form-stock"
              />
            </div>
            <div>
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                data-testid="product-form-image"
              />
              <div className="mt-2">
                <Label htmlFor="upload">Or upload</Label>
                <Input
                  id="upload"
                  type="file"
                  accept="image/*"
                  onChange={onUpload}
                  disabled={uploading}
                  data-testid="product-form-upload"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                data-testid="product-form-featured"
              />
              Featured
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button data-testid="product-form-save" onClick={save} disabled={saving || uploading}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
