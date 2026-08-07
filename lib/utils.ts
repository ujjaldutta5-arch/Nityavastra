import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { StaffRole } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatINR = (v: number | string | null | undefined) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);

export const CATEGORIES = [
  { slug: "all", name: "All Products" },
  { slug: "sarees", name: "Sarees" },
  { slug: "daily-wear", name: "Daily Wear" },
  { slug: "home-essentials", name: "Home Essentials" },
] as const;

export const STAFF_ROLES: StaffRole[] = ["admin", "order_manager", "inventory_manager"];

export function isStaff(role?: string | null): boolean {
  return STAFF_ROLES.includes(role as StaffRole);
}

export function slugify(text: string | null | undefined): string {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateOrderId(): string {
  const n = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `NV-${n}-${r}`;
}
