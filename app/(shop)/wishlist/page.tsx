"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useCart();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 md:py-16">
      <h1 className="font-serif text-3xl mb-8">Wishlist</h1>
      {!wishlist?.length ? (
        <p className="text-[#78716C]">No saved items. <Link href="/shop" className="text-[#7C1F30]">Browse shop</Link></p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {wishlist.map((p) => (
            <div key={p.id} className="group">
              <Link href={`/product/${p.slug || p.id}`}>
                <div className="aspect-[3/4] overflow-hidden rounded-lg mb-3">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <h3 className="font-serif text-lg">{p.name}</h3>
                <p>{formatINR(p.price)}</p>
              </Link>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => toggleWishlist(p.id)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
