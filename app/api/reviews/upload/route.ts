import { requireUser, json, err } from "@/lib/api-auth";

/** Buyer review photo upload (authenticated customers). */
export async function POST(request: Request) {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;

  const form = await request.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) return err("file required");
  if (!file.type.startsWith("image/")) return err("Images only");

  const ext = file.name?.split(".").pop() || "jpg";
  const path = `${ctx.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error } = await ctx.admin.storage.from("reviews").upload(path, buf, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) return err(error.message, 500);

  const { data } = ctx.admin.storage.from("reviews").getPublicUrl(path);
  return json({ url: data.publicUrl, path });
}
