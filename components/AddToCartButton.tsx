"use client";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const wished = isInWishlist(product.id);

  const onAdd = async () => {
    if (!user) {
      toast.message("Please login to add to cart");
      router.push(`/login?next=/product/${product.slug || product.id}`);
      return;
    }
    try {
      await addToCart(product.id);
      toast.success("Added to cart");
    } catch (e) {
      toast.error((e as Error).message || "Could not add");
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        data-testid="add-to-cart-button"
        onClick={onAdd}
        disabled={!product.stock}
        className="bg-[#7C1F30] hover:bg-[#9a2840] text-white px-8"
      >
        {product.stock ? "Add to Cart" : "Out of Stock"}
      </Button>
      <Button
        variant="outline"
        data-testid="wishlist-toggle-button"
        onClick={() => toggleWishlist(product.id)}
      >
        {wished ? "Wishlisted" : "Wishlist"}
      </Button>
    </div>
  );
}
