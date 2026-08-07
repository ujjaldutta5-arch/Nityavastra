"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CmsPage {
  id: string;
  slug?: string | null;
  title?: string | null;
  html_content?: string | null;
}

interface PageForm {
  slug: string;
  title: string;
  html_content: string;
}

export default function AdminPagesPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [selected, setSelected] = useState<CmsPage | null>(null);
  const [form, setForm] = useState<PageForm>({ slug: "", title: "", html_content: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pages", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      const list = (data.pages || []) as CmsPage[];
      setPages(list);
      if (list.length && !selected) {
        setSelected(list[0]);
        setForm({
          slug: list[0].slug || "",
          title: list[0].title || "",
          html_content: list[0].html_content || "",
        });
      }
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectPage = (p: CmsPage) => {
    setSelected(p);
    setForm({
      slug: p.slug || "",
      title: p.title || "",
      html_content: p.html_content || "",
    });
    setPreview(false);
  };

  const newPage = () => {
    setSelected(null);
    setForm({ slug: "", title: "", html_content: "" });
    setPreview(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        slug: form.slug,
        title: form.title,
        html_content: form.html_content,
      };
      if (selected?.id) body.id = selected.id;
      const res = await fetch("/api/admin/pages", {
        method: selected?.id ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success("Page saved");
      setSelected(data.page as CmsPage);
      const listRes = await fetch("/api/admin/pages", { credentials: "include" });
      const listData = await listRes.json();
      setPages((listData.pages || []) as CmsPage[]);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-pages">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-[#7C1F30]">Pages</h1>
          <p className="text-sm text-[#57534E] mt-1">CMS content editor</p>
        </div>
        <Button data-testid="page-create" variant="outline" onClick={newPage}>
          New page
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-[#57534E]">Loading…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <aside className="rounded-lg border border-[#7C1F30]/15 bg-white p-2 space-y-1">
            {pages.map((p) => (
              <button
                key={p.id}
                type="button"
                data-testid={`page-select-${p.slug}`}
                onClick={() => selectPage(p)}
                className={`w-full text-left rounded-md px-3 py-2 text-sm ${
                  selected?.id === p.id ? "bg-[#7C1F30] text-[#FAF3E7]" : "hover:bg-[#7C1F30]/10"
                }`}
              >
                {p.title}
                <div className="text-xs opacity-80">/{p.slug}</div>
              </button>
            ))}
          </aside>

          <div className="rounded-lg border border-[#7C1F30]/15 bg-white p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  data-testid="page-form-slug"
                />
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  data-testid="page-form-title"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={preview ? "outline" : "default"}
                data-testid="page-edit-mode"
                onClick={() => setPreview(false)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant={preview ? "default" : "outline"}
                data-testid="page-preview-mode"
                onClick={() => setPreview(true)}
              >
                Preview
              </Button>
              {form.slug && (
                <Button size="sm" variant="ghost" asChild>
                  <a href={`/pages/${form.slug}`} target="_blank" rel="noreferrer">
                    View live
                  </a>
                </Button>
              )}
            </div>
            {preview ? (
              <div
                className="prose-cms min-h-[280px] rounded-md border border-[#7C1F30]/10 p-4"
                dangerouslySetInnerHTML={{ __html: form.html_content }}
              />
            ) : (
              <div>
                <Label>HTML content</Label>
                <Textarea
                  rows={14}
                  value={form.html_content}
                  onChange={(e) => setForm({ ...form, html_content: e.target.value })}
                  data-testid="page-form-html"
                  className="font-mono text-xs"
                />
              </div>
            )}
            <Button data-testid="page-form-save" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save page"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
