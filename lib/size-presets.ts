import type { SizeType } from "@/types/database";

export const SIZE_PRESETS: Record<Exclude<SizeType, "custom">, string[]> = {
  none: [],
  garment: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  trouser: ["28", "30", "32", "34", "36", "38", "40", "42"],
  saree: ["Free Size", "Standard"],
  kids: ["0-3M", "3-6M", "6-12M", "1-2Y", "2-3Y", "3-4Y", "4-5Y"],
};

export const SIZE_TYPE_LABELS: Record<SizeType, string> = {
  none: "None (color only / no size)",
  garment: "Garment (XS–XXXL)",
  trouser: "Trouser waist (28–42)",
  saree: "Saree (Free / Standard)",
  kids: "Kids (0-3M – 4-5Y)",
  custom: "Custom sizes",
};

export function slugPart(s: string) {
  return String(s || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
}

export function makeVariantSku(productId: string, size: string, color: string) {
  const parts = [slugPart(productId) || "P", slugPart(size) || "OS", slugPart(color) || "DEF"];
  return parts.join("-");
}
