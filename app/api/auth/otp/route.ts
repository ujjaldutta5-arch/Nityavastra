import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { json, err } from "@/lib/api-auth";
import type { User } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: string;
    phone?: string;
    code?: string;
    name?: string;
  };
  const action = body.action || "send";
  const phone = String(body.phone || "").replace(/\D/g, "");
  const admin = createAdminClient();

  if (action === "send") {
    if (phone.length < 10) return err("Valid phone required");
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await admin.from("otp_codes").insert({ phone, code, expires_at: expires, used: false });
    console.log("[OTP]", phone, code);
    return json({ success: true, demoCode: code });
  }

  if (action === "verify") {
    const code = String(body.code || "");
    const name = body.name || "";
    if (!phone || !code) return err("phone and code required");

    const { data: otp } = await admin
      .from("otp_codes")
      .select("*")
      .eq("phone", phone)
      .eq("code", code)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otp) return err("Invalid or expired OTP", 401);
    await admin.from("otp_codes").update({ used: true }).eq("id", (otp as { id: string }).id);

    const email = `${phone}@phone.nityavastra.local`;
    const password = `otp-${phone}-${(process.env.SUPABASE_SERVICE_ROLE_KEY || "secret").slice(0, 12)}`;

    const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    let user: User | undefined = listed?.users?.find(
      (u) => u.email === email || u.user_metadata?.phone === phone
    );

    if (!user) {
      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { phone, name, role: "customer" },
      });
      if (error) return err(error.message, 500);
      user = created.user;
    } else {
      await admin.auth.admin.updateUserById(user.id, { password });
    }

    await admin.from("profiles").upsert({
      id: user.id,
      phone,
      name: name || user.user_metadata?.name || "",
      email,
      role: "customer",
    });

    const supabase = await createClient();
    const { data: sessionData, error: signErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signErr) return err(signErr.message, 500);

    return json({
      user: sessionData.user,
      session: sessionData.session,
      profile: { id: user.id, phone, name, role: "customer" },
    });
  }

  return err("Unknown action");
}
