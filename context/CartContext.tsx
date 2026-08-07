"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { CartItem, Product } from "@/types";

export type CartLine = CartItem & {
  product?: Product | null;
  unit_price?: number;
};

type CartContextValue = {
  items: CartLine[];
  wishlist: Product[];
  wishlistIds: string[];
  cartTotal: number;
  cartCount: number;
  addToCart: (
    product_id: string,
    quantity?: number,
    variant_sku?: string | null
  ) => Promise<boolean>;
  updateQuantity: (
    product_id: string,
    quantity: number,
    variant_sku?: string | null
  ) => Promise<void>;
  removeFromCart: (product_id: string, variant_sku?: string | null) => Promise<void>;
  toggleWishlist: (product_id: string) => Promise<void>;
  isInWishlist: (product_id: string) => boolean;
  refreshCart: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);
const WISHLIST_KEY = "nv_wishlist";

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  const refreshCart = useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      return;
    }
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) throw new Error("cart fetch failed");
      const data = await res.json();
      const raw = (data.items || []) as CartLine[];
      setItems(
        raw.map((i) => ({
          ...i,
          product: i.product || i.products || null,
        }))
      );
    } catch (e) {
      console.error("Cart refresh error:", e);
    }
  }, [user?.id]);

  const refreshWishlist = useCallback(async () => {
    try {
      const raw = localStorage.getItem(WISHLIST_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      setWishlistIds(ids);
      if (!ids.length) {
        setWishlist([]);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase.from("products").select("*").in("id", ids);
      const products = (data || []) as Product[];
      const byId = Object.fromEntries(products.map((p) => [p.id, p]));
      setWishlist(ids.map((id) => byId[id]).filter(Boolean));
      try {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
      } catch {
        /* optional */
      }
    } catch {
      setWishlist([]);
      setWishlistIds([]);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist, user?.id]);

  const addToCart = async (
    product_id: string,
    quantity = 1,
    variant_sku: string | null = null
  ) => {
    if (!user?.id) {
      toast.error("Please login to add items to your cart");
      return false;
    }
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id, quantity, variant_sku }),
      });
      if (!res.ok) throw new Error("add failed");
      await refreshCart();
      toast.success("Added to cart");
      return true;
    } catch {
      toast.error("Could not add to cart");
      return false;
    }
  };

  const updateQuantity = async (
    product_id: string,
    quantity: number,
    variant_sku: string | null = null
  ) => {
    if (!user?.id) return;
    await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id, quantity, variant_sku }),
    });
    await refreshCart();
  };

  const removeFromCart = async (product_id: string, variant_sku: string | null = null) => {
    if (!user?.id) return;
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id, variant_sku }),
    });
    await refreshCart();
    toast.success("Removed from cart");
  };

  const toggleWishlist = async (product_id: string) => {
    const raw = localStorage.getItem(WISHLIST_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const idx = list.indexOf(product_id);
    let added: boolean;
    if (idx >= 0) {
      list.splice(idx, 1);
      added = false;
    } else {
      list.push(product_id);
      added = true;
    }
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    await refreshWishlist();
    toast.success(added ? "Added to wishlist" : "Removed from wishlist");
  };

  const isInWishlist = (product_id: string) =>
    wishlistIds.includes(product_id) || wishlist.some((p) => p?.id === product_id);

  const cartTotal = items.reduce(
    (sum, i) =>
      sum + (i.products?.price || i.product?.price || i.unit_price || 0) * i.quantity,
    0
  );
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        wishlist,
        wishlistIds,
        cartTotal,
        cartCount,
        addToCart,
        updateQuantity,
        removeFromCart,
        toggleWishlist,
        isInWishlist,
        refreshCart,
        refreshWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
