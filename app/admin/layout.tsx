"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isStaff, cn } from "@/lib/utils";
import type { Profile, StaffRole } from "@/types";

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  /** Roles that can see this link. Admin always sees everything. */
  roles: StaffRole[];
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", exact: true, roles: ["admin", "order_manager", "inventory_manager"] },
  { href: "/admin/products", label: "Products", roles: ["admin", "inventory_manager"] },
  { href: "/admin/orders", label: "Orders", roles: ["admin", "order_manager"] },
  { href: "/admin/coupons", label: "Coupons", roles: ["admin", "inventory_manager"] },
  { href: "/admin/banners", label: "Banners", roles: ["admin", "inventory_manager"] },
  { href: "/admin/pages", label: "Pages", roles: ["admin"] },
  { href: "/admin/settings", label: "Settings", roles: ["admin"] },
  { href: "/admin/returns", label: "Returns", roles: ["admin", "order_manager"] },
  { href: "/admin/reviews", label: "Reviews", roles: ["admin", "order_manager"] },
  { href: "/admin/crm", label: "CRM", roles: ["admin", "order_manager"] },
  { href: "/admin/reports", label: "Reports", roles: ["admin"] },
  { href: "/admin/staff", label: "Staff", roles: ["admin"] },
  { href: "/admin/shiprocket", label: "Shiprocket", roles: ["admin", "order_manager"] },
];

function canAccess(role: string | null | undefined, item: NavItem): boolean {
  if (role === "admin") return true;
  return item.roles.includes(role as StaffRole);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = useMemo(() => {
    const role = profile?.role;
    return NAV.filter((item) => canAccess(role, item));
  }, [profile?.role]);

  useEffect(() => {
    let cancelled = false;
    const gate = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?next=/admin");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!data || !isStaff(data.role) || data.banned) {
        router.replace("/login?next=/admin");
        return;
      }
      setProfile(data as Profile);
      setReady(true);
    };
    gate();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Redirect staff away from pages their role cannot access
  useEffect(() => {
    if (!ready || !profile) return;
    const match = NAV.find((item) =>
      item.exact
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`)
    );
    if (match && !canAccess(profile.role, match)) {
      const fallback = NAV.find((item) => canAccess(profile.role, item));
      router.replace(fallback?.href || "/admin");
    }
  }, [ready, profile, pathname, router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#FAF3E7] flex items-center justify-center text-[#7C1F30]">
        Checking access…
      </div>
    );
  }

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) =>
    visibleNav.map((item) => {
      const active = item.exact
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
      return (
        <Link
          key={item.href}
          href={item.href}
          data-testid={`admin-nav-${item.label.toLowerCase()}`}
          onClick={onNavigate}
          className={cn(
            "block rounded-md px-3 py-2 text-sm transition-colors",
            active
              ? "bg-[#7C1F30] text-[#FAF3E7]"
              : "text-[#2A1508] hover:bg-[#7C1F30]/10"
          )}
        >
          {item.label}
        </Link>
      );
    });

  return (
    <div className="min-h-screen bg-[#FAF3E7] text-[#2A1508]">
      <div className="flex min-h-screen">
        <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-[#7C1F30]/15 bg-[#FAF3E7]">
          <div className="p-5 border-b border-[#7C1F30]/15">
            <p className="font-serif text-xl text-[#7C1F30]">Nityavastra</p>
            <p className="text-xs text-[#57534E] mt-0.5">Admin · {profile?.role}</p>
          </div>
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            <NavLinks />
          </nav>
          <div className="p-3 border-t border-[#7C1F30]/15">
            <Link
              href="/"
              data-testid="admin-back-to-store"
              className="block rounded-md px-3 py-2 text-sm text-[#7C1F30] hover:bg-[#7C1F30]/10"
            >
              ← Back to store
            </Link>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="md:hidden flex items-center justify-between border-b border-[#7C1F30]/15 px-4 py-3 bg-[#FAF3E7]">
            <div>
              <p className="font-serif text-lg text-[#7C1F30]">Nityavastra Admin</p>
            </div>
            <button
              type="button"
              data-testid="admin-mobile-menu"
              className="text-sm px-3 py-1.5 border border-[#7C1F30]/30 rounded-md"
              onClick={() => setMobileOpen((v) => !v)}
            >
              Menu
            </button>
          </header>
          {mobileOpen && (
            <nav className="md:hidden border-b border-[#7C1F30]/15 p-3 space-y-0.5 bg-[#FAF3E7]">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
              <Link
                href="/"
                className="block rounded-md px-3 py-2 text-sm text-[#7C1F30]"
                onClick={() => setMobileOpen(false)}
              >
                ← Back to store
              </Link>
            </nav>
          )}
          <main className="flex-1 p-4 md:p-8 overflow-x-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
