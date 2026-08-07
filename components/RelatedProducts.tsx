"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types";

export default function RelatedProducts({
  productId,
  category,
}: {
  productId: string;
  category?: string;
}) {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    if (!productId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/products/${productId}/related?limit=6`);
        if (res.ok) {
          const data = await res.json();
          setItems((data.products || data || []) as Product[]);
          return;
        }
      } catch {
        /* fallback below */
      }
      const supabase = createClient();
      let q = supabase.from("products").select("*").neq("id", productId).limit(4);
      if (category) q = q.eq("category", category);
      const { data } = await q;
      setItems((data || []) as Product[]);
    };
    load();
  }, [productId, category]);

  if (!items.length) return null;

  return (
    <section
      className="mt-12 md:mt-16 border-t border-[#E7E5E4] pt-10 md:pt-12"
      data-testid="related-products"
    >
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[#7C1F30] mb-1">
            You may also like
          </div>
          <h2 className="font-serif text-xl md:text-2xl lg:text-3xl text-[#2A1508]">
            More from {category || "this collection"}
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {items.slice(0, 4).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
