"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingBag, Heart, User, Search, Menu, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatINR, isStaff } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const LOGO =
  "https://customer-assets-lqy194kg.emergentagent.net/job_nityavastra-shop/artifacts/dirh3az1_Updated%20Logo%20Nityavastra.png";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=sarees", label: "Sarees" },
  { href: "/shop?category=daily-wear", label: "Daily Wear" },
  { href: "/shop?category=home-essentials", label: "Essentials" },
];

type Suggest = {
  id: string;
  name: string;
  slug?: string | null;
  image?: string;
  price?: number;
};

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { cartCount, wishlist } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggest[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!searchOpen || q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setSuggestions((data.products || []) as Suggest[]);
      } catch {
        setSuggestions([]);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q, searchOpen]);

  const doSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      router.push(`/shop?search=${encodeURIComponent(q.trim())}`);
      setSearchOpen(false);
      setQ("");
      setSuggestions([]);
    }
  };

  return (
    <header
      data-testid="site-navbar"
      className="sticky top-0 z-50 backdrop-blur-xl bg-[#FAF3E7]/85 border-b border-[#E7E5E4]/60"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="mobile-menu-btn">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[#FAF3E7]">
                <nav className="flex flex-col gap-6 mt-8">
                  {NAV_LINKS.map((l) => (
                    <Link
                      key={l.label}
                      href={l.href}
                      onClick={() => setMobileOpen(false)}
                      className="text-lg font-serif text-[#1C1917] hover:text-[#7C1F30] transition-colors"
                    >
                      {l.label}
                    </Link>
                  ))}
                  <Link
                    href="/about"
                    onClick={() => setMobileOpen(false)}
                    className="text-lg font-serif text-[#1C1917] hover:text-[#7C1F30]"
                  >
                    About
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setMobileOpen(false)}
                    className="text-lg font-serif text-[#1C1917] hover:text-[#7C1F30]"
                  >
                    Contact
                  </Link>
                  {user && isStaff(user.role) && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="text-lg font-serif text-[#7C1F30]"
                      data-testid="mobile-admin-link"
                    >
                      Admin Console
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          <Link href="/" data-testid="site-logo" className="flex items-center gap-2 md:gap-3">
            <Image
              src={LOGO}
              alt="Nityavastra"
              width={44}
              height={44}
              className="w-9 h-9 md:w-11 md:h-11 rounded-full object-cover"
              priority
            />
            <div className="hidden sm:block">
              <div className="font-serif text-lg md:text-xl leading-none text-[#2A1508] tracking-wide">
                Nityavastra
              </div>
              <div className="text-[9px] uppercase tracking-[0.25em] text-[#B8871E] mt-1">
                Sacred Weaves · Everyday Grace
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                data-testid={`nav-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm text-[#1C1917] hover:text-[#7C1F30] transition-colors font-medium"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen((s) => !s)}
              data-testid="search-toggle-btn"
            >
              <Search className="h-5 w-5" />
            </Button>

            <Link href="/wishlist" data-testid="nav-wishlist-link">
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="h-5 w-5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#7C1F30] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Button>
            </Link>

            <Link href="/cart" data-testid="nav-cart-link">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span
                    data-testid="cart-count-badge"
                    className="absolute -top-0.5 -right-0.5 bg-[#7C1F30] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center"
                  >
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="user-menu-btn">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white">
                  <div className="px-2 py-1.5 text-sm font-medium">{user.name || "Guest"}</div>
                  <div className="px-2 pb-1.5 text-xs text-muted-foreground">
                    {user.email || user.phone}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/account")}
                    data-testid="menu-account"
                  >
                    My Account
                  </DropdownMenuItem>
                  {isStaff(user.role) && (
                    <DropdownMenuItem
                      onClick={() => router.push("/admin")}
                      data-testid="menu-admin"
                    >
                      Admin Console
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => signOut()} data-testid="menu-logout">
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" data-testid="nav-login-link">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {searchOpen && (
          <div className="pb-4 relative">
            <form onSubmit={doSearch}>
              <Input
                autoFocus
                value={q}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                placeholder="Search sarees, bedsheets, essentials..."
                className="bg-white border-[#E7E5E4]"
                data-testid="search-input"
              />
            </form>
            {suggestions.length > 0 && (
              <ul
                className="absolute left-0 right-0 mt-1 z-50 rounded-lg border border-[#E7E5E4] bg-white shadow-lg overflow-hidden"
                data-testid="search-suggestions"
              >
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#FAF3E7]"
                      onClick={() => {
                        router.push(`/product/${s.slug || s.id}`);
                        setSearchOpen(false);
                        setQ("");
                        setSuggestions([]);
                      }}
                    >
                      {s.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.image} alt="" className="h-10 w-8 object-cover rounded" />
                      )}
                      <span className="flex-1 text-sm text-[#2A1508]">{s.name}</span>
                      {s.price != null && (
                        <span className="text-xs text-[#78716C]">{formatINR(s.price)}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
