import type { Product, ProductVariant } from "@/types/database";

/** Resolve sellable stock for a product or a specific variant SKU. */
export function getAvailableStock(product: Product, variantSku?: string | null): number {
  if (product.has_variants && Array.isArray(product.variants) && product.variants.length) {
    if (variantSku) {
      const v = product.variants.find((x) => x.sku === variantSku);
      return v ? Number(v.stock ?? 0) : 0;
    }
    return product.variants.reduce((sum, v) => sum + Number(v.stock ?? 0), 0);
  }
  return Number(product.stock ?? 0);
}

export function findVariant(product: Product, variantSku?: string | null): ProductVariant | null {
  if (!variantSku || !Array.isArray(product.variants)) return null;
  return product.variants.find((v) => v.sku === variantSku) || null;
}

export function variantLabel(v: ProductVariant | null | undefined): string {
  if (!v) return "";
  return [v.size, v.color].filter(Boolean).join(" / ");
}

export function hasNonZeroDimensions(d?: Product["dimensions"] | null): boolean {
  if (!d || typeof d !== "object") return false;
  return Boolean(
    Number(d.length_cm) || Number(d.width_cm) || Number(d.height_cm) || Number(d.weight_g)
  );
}
