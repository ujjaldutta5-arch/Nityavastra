"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Review {
  id: string;
  title?: string | null;
  rating?: number | null;
  comment?: string | null;
  visible?: boolean | null;
  featured?: boolean | null;
  admin_reply?: string | null;
}

export default function AdminReviewsPage() {
  const [rows, setRows] = useState<Review[]>([]);
  const [filter, setFilter] = useState("visible");
  const [reply, setReply] = useState<Record<string, string>>({});

  const load = async () => {
    const res = await fetch(`/api/reviews?admin=1&filter=${filter}`);
    const data = await res.json();
    setRows((data.reviews || []) as Review[]);
  };

  useEffect(() => {
    load();
  }, [filter]);

  const patch = async (id: string, updates: Record<string, unknown>) => {
    const res = await fetch("/api/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) toast.error((await res.json()).error);
    else {
      toast.success("Updated");
      load();
    }
  };

  return (
    <div>
      <h1 className="font-serif text-2xl mb-6">Reviews</h1>
      <div className="flex gap-2 mb-4">
        {["visible", "hidden", "featured"].map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f}
          </Button>
        ))}
      </div>
      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.id} className="bg-white border rounded-lg p-4">
            <p className="font-medium">{r.title || "Review"} ★{r.rating}</p>
            <p className="text-sm">{r.comment}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={() => patch(r.id, { visible: !r.visible })}>
                {r.visible ? "Hide" : "Show"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => patch(r.id, { featured: !r.featured })}>
                Feature
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  await fetch(`/api/reviews?id=${r.id}`, { method: "DELETE" });
                  load();
                }}
              >
                Delete
              </Button>
            </div>
            <div className="flex gap-2 mt-3">
              <Input
                placeholder="Admin reply"
                value={reply[r.id] || r.admin_reply || ""}
                onChange={(e) => setReply({ ...reply, [r.id]: e.target.value })}
              />
              <Button size="sm" onClick={() => patch(r.id, { admin_reply: reply[r.id] })}>
                Reply
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
