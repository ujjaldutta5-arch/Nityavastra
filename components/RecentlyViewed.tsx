"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types";

const KEY = "nv_recently_viewed";
const MAX = 8;

export function trackView(product: { id?: string } | null | undefined) {
  if (!product?.id) return;
  try {
    const raw = localStorage.getItem(KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const dedup = [product.id, ...list.filter((id) => id !== product.id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(dedup));
  } catch {
    /* ignore */
  }
}

export default function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      const wanted = ids.filter((id) => id !== excludeId);
      if (!wanted.length) {
        setItems([]);
        return;
      }
      const supabase = createClient();
      supabase
        .from("products")
        .select("*")
        .in("id", wanted)
        .then(({ data }) => {
          const products = (data || []) as Product[];
          const byId = Object.fromEntries(products.map((p) => [p.id, p]));
          setItems(wanted.map((id) => byId[id]).filter(Boolean).slice(0, 4));
        });
    } catch {
      /* ignore */
    }
  }, [excludeId]);

  if (!items.length) return null;

  return (
    <section
      className="mt-12 md:mt-16 border-t border-[#E7E5E4] pt-10 md:pt-12"
      data-testid="recently-viewed"
    >
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-[#7C1F30] mb-1">
          Continue browsing
        </div>
        <h2 className="font-serif text-xl md:text-2xl lg:text-3xl text-[#2A1508]">
          Recently viewed
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
