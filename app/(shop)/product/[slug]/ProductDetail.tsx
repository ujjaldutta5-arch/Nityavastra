"use client";

import { useEffect, useState } from "react";
import { Star, Heart, Minus, Plus, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ProductGallery, { type GalleryMediaItem } from "@/components/ProductGallery";
import RelatedProducts from "@/components/RelatedProducts";
import RecentlyViewed, { trackView } from "@/components/RecentlyViewed";
import PincodeCheck from "@/components/PincodeCheck";
import ReviewSection from "@/components/ReviewSection";
import type { Product } from "@/types";

export default function ProductDetail({ product: p }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const liked = isInWishlist(p.id);
  const stockAvailable = p.stock || 0;

  useEffect(() => {
    trackView(p);
  }, [p]);

  const media: GalleryMediaItem[] =
    Array.isArray(p.media) && p.media.length
      ? (p.media as GalleryMediaItem[])
      : p.image
        ? [{ kind: "image", url: p.image }]
        : [];

  const dimensions = p.dimensions as { weight_g?: number } | undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <ProductGallery media={media} fallbackImage={p.image} alt={p.name} />

        <div>
          <p className="uppercase text-xs tracking-[0.3em] text-[#7C1F30] mb-3">
            {(p.category || "").replace(/-/g, " ")}
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

          {stockAvailable <= 5 && stockAvailable > 0 && (
            <div className="mb-4 text-sm text-[#7C1F30] font-medium">
              Only {stockAvailable} left in stock!
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
                onClick={() => setQty((q) => q + 1)}
                data-testid="qty-inc"
                className="p-3 hover:bg-[#F5F5F4] rounded-r-full transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-3 mb-8">
            <Button
              onClick={() => addToCart(p.id, qty)}
              disabled={stockAvailable === 0}
              data-testid="add-to-cart-btn"
              className="flex-1 bg-[#7C1F30] hover:bg-[#8D2A3D] text-white rounded-full py-6 uppercase text-xs tracking-[0.2em] disabled:opacity-50"
            >
              {stockAvailable === 0 ? "Out of Stock" : "Add to Cart"}
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
