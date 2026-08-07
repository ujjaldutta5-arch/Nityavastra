import { createAdminClient } from "@/lib/supabase/admin";
import { json, err } from "@/lib/api-auth";
import { queueNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  };
  const { name, email, subject, message } = body;
  if (!email || !message) return err("email and message required");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tickets")
    .insert({
      email,
      name: name || "",
      subject: subject || "Contact form",
      status: "open",
      messages: [{ from: "customer", body: message, at: new Date().toISOString() }],
    })
    .select()
    .single();

  if (error) return err(error.message, 500);

  await queueNotification({
    channel: "email",
    event: "contact_form",
    recipient: process.env.SELLER_PHONE || "admin",
    subject: `Contact: ${subject || "New message"}`,
    body: `${name} <${email}>: ${message}`,
  });

  return json({ ticket: data }, 201);
}
