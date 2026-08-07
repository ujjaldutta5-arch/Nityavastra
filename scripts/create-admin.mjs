/**
 * Create or promote an admin in Supabase Auth + profiles.
 * Usage: node scripts/create-admin.mjs admin@nityavastra.com 'YourSecurePass' 'Admin'
 *
 * Safe to re-run if the auth user already exists but profiles is empty.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim();
    }
  } catch {
    /* ignore */
  }
}

loadEnv();

const [email, password, name = "Admin"] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: node scripts/create-admin.mjs <email> <password> [name]");
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function findUserByEmail(targetEmail) {
  let page = 1;
  const perPage = 200;
  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users || [];
    const hit = users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (hit) return hit;
    if (users.length < perPage) return null;
    page += 1;
  }
  return null;
}

let user = null;

const created = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { name, role: "admin" },
});

if (created.error) {
  if (!/already (been )?registered|already exists/i.test(created.error.message)) {
    console.error(created.error.message);
    process.exit(1);
  }
  console.log("Auth user already exists — promoting to admin…");
  user = await findUserByEmail(email);
  if (!user) {
    console.error("Could not find existing auth user for", email);
    process.exit(1);
  }
  const { error: updErr } = await supabase.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
    user_metadata: { ...user.user_metadata, name, role: "admin" },
  });
  if (updErr) {
    console.error("Failed to update auth user:", updErr.message);
    process.exit(1);
  }
} else {
  user = created.data.user;
}

const { error: pErr } = await supabase.from("profiles").upsert(
  {
    id: user.id,
    email,
    name,
    role: "admin",
    banned: false,
    updated_at: new Date().toISOString(),
  },
  { onConflict: "id" }
);

if (pErr) {
  console.error("Profile upsert failed:", pErr.message);
  console.error("Run this in SQL Editor:");
  console.error(
    `INSERT INTO profiles (id, email, name, role) VALUES ('${user.id}', '${email}', '${name}', 'admin') ON CONFLICT (id) DO UPDATE SET role = 'admin', email = EXCLUDED.email, name = EXCLUDED.name;`
  );
  process.exit(1);
}

console.log("Admin ready:");
console.log("  email:", email);
console.log("  id:   ", user.id);
console.log("  role: admin");
console.log("Login at /login with this email + password.");
