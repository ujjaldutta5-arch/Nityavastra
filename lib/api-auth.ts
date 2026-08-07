import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStaff } from "@/lib/utils";
import type { Profile, StaffRole } from "@/types";

type AuthSuccess = {
  user: User;
  profile: Profile | null;
  supabase: Awaited<ReturnType<typeof createClient>>;
  admin: ReturnType<typeof createAdminClient>;
  error?: undefined;
};

type AuthError = {
  error: NextResponse;
  user?: undefined;
  profile?: undefined;
  supabase?: undefined;
  admin?: undefined;
};

export async function requireUser(): Promise<AuthSuccess | AuthError> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { user, profile: profile as Profile | null, supabase, admin };
}

export async function requireStaff(
  roles: StaffRole[] | null = null
): Promise<AuthSuccess | AuthError> {
  const ctx = await requireUser();
  if (ctx.error) return ctx;
  const role = (ctx.profile?.role || "customer") as StaffRole;
  if (!isStaff(role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  if (roles && !roles.includes(role) && role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden for role" }, { status: 403 }) };
  }
  if (ctx.profile?.banned) {
    return { error: NextResponse.json({ error: "Account banned" }, { status: 403 }) };
  }
  return ctx;
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
