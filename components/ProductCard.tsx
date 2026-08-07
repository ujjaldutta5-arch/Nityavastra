"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/utils";
import type { Product } from "@/types";

export default function ProductCard({ product }: { product: Product }) {
  const { toggleWishlist, isInWishlist, addToCart } = useCart();
  const liked = isInWishlist(product.id);
  const discount = product.old_price
    ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
    : 0;

  return (
    <div data-testid={`product-card-${product.id}`} className="group relative">
      <Link href={`/product/${product.slug || product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-[#F5F5F4] rounded-md">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full bg-[#E7E5E4]" />
          )}
          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-[#1C1917] text-white text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-medium z-10">
              -{discount}%
            </div>
          )}
          <button
            type="button"
            data-testid={`wishlist-btn-${product.id}`}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              toggleWishlist(product.id);
            }}
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
            aria-label="Toggle wishlist"
          >
            <Heart
              className={`h-4 w-4 ${liked ? "fill-[#7C1F30] text-[#7C1F30]" : "text-[#1C1917]"}`}
            />
          </button>
        </div>
      </Link>

      <div className="pt-4 space-y-1">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#78716C]">
          {(product.category || "").replace(/-/g, " ")}
        </p>
        <Link href={`/product/${product.slug || product.id}`}>
          <h3 className="font-serif text-lg text-[#1C1917] leading-snug line-clamp-1 group-hover:text-[#7C1F30] transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-[#D4A03A] text-[#D4A03A]" />
            <span className="text-xs text-[#78716C]">{product.rating || 4.5}</span>
          </div>
          <span className="text-xs text-[#78716C]">· {product.review_count || 0} reviews</span>
        </div>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-lg font-medium text-[#1C1917]">{formatINR(product.price)}</span>
          {product.old_price && (
            <span className="text-sm text-[#78716C] line-through">
              {formatINR(product.old_price)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            addToCart(product.id, 1);
          }}
          data-testid={`quick-add-btn-${product.id}`}
          className="mt-3 w-full text-xs uppercase tracking-[0.2em] py-3 border border-[#1C1917] text-[#1C1917] hover:bg-[#1C1917] hover:text-white transition-colors rounded-md font-medium"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
