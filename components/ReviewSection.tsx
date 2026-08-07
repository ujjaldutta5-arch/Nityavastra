"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Review } from "@/types";

export default function ReviewSection({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [reason, setReason] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const load = async () => {
    const res = await fetch(`/api/reviews?product_id=${productId}`);
    const data = await res.json();
    setReviews((data.reviews || []) as Review[]);
    if (user) {
      const c = await fetch(`/api/reviews/can-review?product_id=${productId}`);
      const cj = await c.json();
      setCanReview(Boolean(cj.canReview));
      setReason(cj.reason || "");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, user?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, rating, title, comment }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed");
      return;
    }
    toast.success("Review submitted");
    setTitle("");
    setComment("");
    load();
  };

  return (
    <section className="mt-16 border-t border-[#E7E5E4] pt-12" data-testid="reviews-section">
      <h2 className="font-serif text-2xl text-[#2A1508] mb-6">Reviews</h2>
      <div className="space-y-6 mb-10">
        {reviews.length === 0 && <p className="text-[#78716C]">No reviews yet.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="border-b border-[#E7E5E4] pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#B8871E]">{"★".repeat(r.rating)}</span>
              {r.featured && <span className="text-xs text-[#7C1F30]">Featured</span>}
            </div>
            {r.title && <p className="font-medium text-[#2A1508]">{r.title}</p>}
            <p className="text-sm text-[#57534E]">{r.comment}</p>
            <p className="text-xs text-[#78716C] mt-1">{r.profiles?.name || "Verified buyer"}</p>
            {r.admin_reply && (
              <div className="mt-2 pl-3 border-l-2 border-[#7C1F30] text-sm text-[#57534E]">
                <span className="font-medium">Nityavastra · Admin:</span> {r.admin_reply}
              </div>
            )}
          </div>
        ))}
      </div>

      {canReview ? (
        <form onSubmit={submit} className="max-w-lg space-y-3">
          <p className="text-sm font-medium">Write a review</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setRating(n)}
                className={n <= rating ? "text-[#B8871E]" : "text-[#D6D3D1]"}
              >
                ★
              </button>
            ))}
          </div>
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Your experience" value={comment} onChange={(e) => setComment(e.target.value)} />
          <Button type="submit" data-testid="submit-review" className="bg-[#7C1F30] text-white">
            Submit review
          </Button>
        </form>
      ) : (
        <p className="text-sm text-[#78716C]">
          {!user
            ? "Login to review after purchase."
            : reason === "already"
              ? "You already reviewed this product."
              : reason === "not_purchased"
                ? "Purchase this item to leave a review."
                : null}
        </p>
      )}
    </section>
  );
}
