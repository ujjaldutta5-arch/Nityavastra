import { requireStaff, json, err } from "@/lib/api-auth";

export async function POST(request: Request) {
  const ctx = await requireStaff(["admin", "inventory_manager"]);
  if (ctx.error) return ctx.error;

  const form = await request.formData();
  const file = form.get("file");
  const bucket = String(form.get("bucket") || "products");
  if (!file || !(file instanceof File)) return err("file required");

  const ext = file.name?.split(".").pop() || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error } = await ctx.admin.storage.from(bucket).upload(path, buf, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) return err(error.message, 500);

  const { data } = ctx.admin.storage.from(bucket).getPublicUrl(path);
  return json({ url: data.publicUrl, path });
}
