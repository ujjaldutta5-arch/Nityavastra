"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";

export default function CartPage() {
  const { items, cartTotal, updateQuantity, removeFromCart } = useCart();

  if (!items.length) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center" data-testid="cart-empty">
        <h1 className="font-serif text-3xl mb-4">Your cart is empty</h1>
        <Link href="/shop" className="text-[#7C1F30] underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 md:py-16">
      <h1 className="font-serif text-3xl mb-8">Cart</h1>
      <div className="space-y-6">
        {items.map((item) => {
          const p = (item.products || item.product || {}) as Partial<Product>;
          return (
            <div key={item.id} className="flex gap-4 border-b border-[#E7E5E4] pb-6" data-testid="cart-item">
              <img src={p.image} alt={p.name || ""} className="w-24 h-32 object-cover rounded-md" />
              <div className="flex-1">
                <Link href={`/product/${p.slug || p.id}`} className="font-serif text-lg hover:text-[#7C1F30]">
                  {p.name}
                </Link>
                <p className="text-[#2A1508] mt-1">{formatINR(p.price)}</p>
                <div className="flex items-center gap-3 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                  >
                    −
                  </Button>
                  <span data-testid="cart-qty">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                  >
                    +
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.product_id)}>
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-10 flex items-center justify-between">
        <p className="text-xl font-medium">Total: {formatINR(cartTotal)}</p>
        <Button asChild className="bg-[#7C1F30] text-white" data-testid="checkout-btn">
          <Link href="/checkout">Checkout</Link>
        </Button>
      </div>
    </div>
  );
}
