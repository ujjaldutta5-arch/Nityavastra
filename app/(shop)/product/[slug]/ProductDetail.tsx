"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Heart, Minus, Plus, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/utils";
import {
  getAvailableStock,
  hasNonZeroDimensions,
} from "@/lib/product-variants";
import { Button } from "@/components/ui/button";
import ProductGallery, { type GalleryMediaItem } from "@/components/ProductGallery";
import RelatedProducts from "@/components/RelatedProducts";
import RecentlyViewed, { trackView } from "@/components/RecentlyViewed";
import PincodeCheck from "@/components/PincodeCheck";
import ReviewSection from "@/components/ReviewSection";
import type { ColorOption, Product, ProductVariant } from "@/types";

export default function ProductDetail({ product: p }: { product: Product }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const liked = isInWishlist(p.id);

  const variants = useMemo(
    () => (Array.isArray(p.variants) ? p.variants : []) as ProductVariant[],
    [p.variants]
  );
  const hasVariants = Boolean(p.has_variants && variants.length);

  const sizes = useMemo(() => {
    if (Array.isArray(p.size_options) && p.size_options.length) return p.size_options;
    return [...new Set(variants.map((v) => v.size).filter(Boolean))];
  }, [p.size_options, variants]);

  const colors = useMemo(() => {
    if (Array.isArray(p.color_options) && p.color_options.length) {
      return p.color_options as ColorOption[];
    }
    const map = new Map<string, string>();
    for (const v of variants) {
      if (v.color) map.set(v.color, v.color_hex || "#CCCCCC");
    }
    return [...map.entries()].map(([name, hex]) => ({ name, hex }));
  }, [p.color_options, variants]);

  const [size, setSize] = useState(sizes[0] || "");
  const [color, setColor] = useState(colors[0]?.name || "");

  useEffect(() => {
    trackView(p);
  }, [p]);

  useEffect(() => {
    if (sizes.length && !sizes.includes(size)) setSize(sizes[0] || "");
  }, [sizes, size]);

  useEffect(() => {
    if (colors.length && !colors.some((c) => c.name === color)) {
      setColor(colors[0]?.name || "");
    }
  }, [colors, color]);

  const selectedVariant = useMemo(() => {
    if (!hasVariants) return null;
    return (
      variants.find((v) => {
        const sizeOk = !sizes.length || v.size === size || (!v.size && !size);
        const colorOk = !colors.length || v.color === color || (!v.color && !color);
        return sizeOk && colorOk;
      }) || null
    );
  }, [hasVariants, variants, size, color, sizes.length, colors.length]);

  const stockAvailable = hasVariants
    ? selectedVariant
      ? Number(selectedVariant.stock ?? 0)
      : 0
    : getAvailableStock(p);
  const threshold = Number(p.low_stock_threshold ?? 5);

  const media: GalleryMediaItem[] =
    Array.isArray(p.media) && p.media.length
      ? (p.media as GalleryMediaItem[])
      : p.image
        ? [{ kind: "image", url: p.image }]
        : [];

  const dimensions = p.dimensions;
  const showDims = hasNonZeroDimensions(dimensions);

  const isSizeOos = (s: string) => {
    if (!hasVariants) return false;
    return !variants.some(
      (v) =>
        (v.size === s || (!v.size && !s)) &&
        (!color || v.color === color || !v.color) &&
        Number(v.stock) > 0
    );
  };

  const isColorOos = (cName: string) => {
    if (!hasVariants) return false;
    return !variants.some(
      (v) =>
        (v.color === cName || (!v.color && !cName)) &&
        (!size || v.size === size || !v.size) &&
        Number(v.stock) > 0
    );
  };

  const handleAdd = async (buyNow = false) => {
    if (hasVariants && !selectedVariant) {
      toast.error("Please select an available size and color");
      return;
    }
    if (stockAvailable <= 0) {
      toast.error("Out of stock");
      return;
    }
    try {
      const ok = await addToCart(p.id, qty, selectedVariant?.sku || null);
      if (!ok) return;
      if (buyNow) router.push("/checkout");
    } catch (e: unknown) {
      toast.error((e as Error).message || "Could not add to cart");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <ProductGallery media={media} fallbackImage={p.image} alt={p.name} />

        <div>
          <p className="uppercase text-xs tracking-[0.3em] text-[#7C1F30] mb-3">
            {(p.category || "").replace(/-/g, " ")}
            {p.sub_category ? ` · ${p.sub_category}` : ""}
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#2A1508] leading-tight mb-4">
            {p.name}
          </h1>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${
                    s <= Math.round(p.rating || 4.5)
                      ? "fill-[#D4A03A] text-[#D4A03A]"
                      : "text-[#E7E5E4]"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-[#78716C]">
              {p.rating || 4.5} · {p.review_count || 0} reviews
            </span>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-serif text-2xl md:text-3xl text-[#2A1508]">
              {formatINR(p.price)}
            </span>
            {p.old_price && (
              <span className="text-lg text-[#78716C] line-through">
                {formatINR(p.old_price)}
              </span>
            )}
          </div>

          <p className="text-base text-[#2A1508]/80 leading-relaxed mb-6">{p.description}</p>

          {p.fabric && (
            <div className="mb-4 text-sm">
              <span className="text-[#78716C]">Fabric: </span>
              <span className="font-medium">{p.fabric}</span>
            </div>
          )}

          {hasVariants && sizes.length > 0 && (
            <div className="mb-5" data-testid="size-picker">
              <p className="text-xs uppercase tracking-wider text-[#78716C] mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const oos = isSizeOos(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={oos}
                      onClick={() => setSize(s)}
                      className={`min-w-[2.75rem] px-3 py-2 rounded-full border text-sm transition-colors ${
                        size === s
                          ? "border-[#7C1F30] bg-[#7C1F30] text-white"
                          : oos
                            ? "border-[#E7E5E4] text-[#A8A29E] line-through cursor-not-allowed"
                            : "border-[#E7E5E4] hover:border-[#7C1F30]"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasVariants && colors.length > 0 && (
            <div className="mb-5" data-testid="color-picker">
              <p className="text-xs uppercase tracking-wider text-[#78716C] mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => {
                  const oos = isColorOos(c.name);
                  return (
                    <button
                      key={c.name}
                      type="button"
                      disabled={oos}
                      onClick={() => setColor(c.name)}
                      title={c.name}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm ${
                        color === c.name
                          ? "border-[#7C1F30] ring-1 ring-[#7C1F30]"
                          : oos
                            ? "opacity-40 line-through cursor-not-allowed border-[#E7E5E4]"
                            : "border-[#E7E5E4] hover:border-[#7C1F30]"
                      }`}
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-black/10"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {stockAvailable > 0 && stockAvailable <= threshold && (
            <div className="mb-4 text-sm text-[#7C1F30] font-medium">
              Only {stockAvailable} left!
            </div>
          )}
          {stockAvailable === 0 && (
            <div className="mb-4 text-sm text-red-600">Out of stock</div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border border-[#E7E5E4] rounded-full">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                data-testid="qty-dec"
                className="p-3 hover:bg-[#F5F5F4] rounded-l-full transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-4 min-w-[3rem] text-center font-medium" data-testid="qty-value">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => Math.min(stockAvailable || 1, q + 1))}
                data-testid="qty-inc"
                className="p-3 hover:bg-[#F5F5F4] rounded-r-full transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            <Button
              onClick={() => handleAdd(false)}
              disabled={stockAvailable === 0}
              data-testid="add-to-cart-btn"
              className="flex-1 min-w-[140px] bg-[#7C1F30] hover:bg-[#8D2A3D] text-white rounded-full py-6 uppercase text-xs tracking-[0.2em] disabled:opacity-50"
            >
              {stockAvailable === 0 ? "Out of Stock" : "Add to Cart"}
            </Button>
            <Button
              onClick={() => handleAdd(true)}
              disabled={stockAvailable === 0}
              variant="outline"
              className="rounded-full border-[#7C1F30] text-[#7C1F30] py-6 px-6 uppercase text-xs tracking-[0.15em]"
            >
              Buy Now
            </Button>
            <Button
              variant="outline"
              onClick={() => toggleWishlist(p.id)}
              data-testid="wishlist-btn"
              className="rounded-full border-[#2A1508] py-6 px-6"
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-[#7C1F30] text-[#7C1F30]" : ""}`} />
            </Button>
          </div>

          {showDims && dimensions && (
            <div className="mb-8 rounded-lg border border-[#E7E5E4] bg-[#FAF3E7]/50 p-4">
              <h3 className="font-serif text-lg text-[#2A1508] mb-3">Product Details</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {Number(dimensions.length_cm) > 0 && (
                  <>
                    <dt className="text-[#78716C]">Length</dt>
                    <dd>{dimensions.length_cm} cm</dd>
                  </>
                )}
                {Number(dimensions.width_cm) > 0 && (
                  <>
                    <dt className="text-[#78716C]">Width</dt>
                    <dd>{dimensions.width_cm} cm</dd>
                  </>
                )}
                {Number(dimensions.height_cm) > 0 && (
                  <>
                    <dt className="text-[#78716C]">Height</dt>
                    <dd>{dimensions.height_cm} cm</dd>
                  </>
                )}
                {Number(dimensions.weight_g) > 0 && (
                  <>
                    <dt className="text-[#78716C]">Weight</dt>
                    <dd>{dimensions.weight_g} g</dd>
                  </>
                )}
                {Number(p.saree_length_m) > 0 && (
                  <>
                    <dt className="text-[#78716C]">Saree length</dt>
                    <dd>{p.saree_length_m} m</dd>
                  </>
                )}
                {p.blouse_piece_included != null && p.category === "sarees" && (
                  <>
                    <dt className="text-[#78716C]">Blouse piece</dt>
                    <dd>{p.blouse_piece_included ? "Included" : "Not included"}</dd>
                  </>
                )}
              </dl>
            </div>
          )}

          <PincodeCheck weightKg={(dimensions?.weight_g || 500) / 1000} />

          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-[#E7E5E4]">
            {[
              { icon: Truck, label: "Free shipping" },
              { icon: ShieldCheck, label: "Secure payment" },
              { icon: RotateCcw, label: "7-day returns" },
            ].map((t) => (
              <div key={t.label} className="text-center">
                <t.icon className="h-5 w-5 text-[#7C1F30] mx-auto mb-2" />
                <div className="text-xs text-[#78716C]">{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 md:mt-16 border-t border-[#E7E5E4] pt-10" data-testid="reviews-section">
        <ReviewSection productId={p.id} />
      </div>

      <RelatedProducts productId={p.id} category={p.category} />
      <RecentlyViewed excludeId={p.id} />
    </div>
  );
}
