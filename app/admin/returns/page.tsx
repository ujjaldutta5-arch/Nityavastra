"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ReturnRow {
  id: string;
  order_id?: string | null;
  type?: string | null;
  status?: string | null;
  reason?: string | null;
}

export default function AdminReturnsPage() {
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [filter, setFilter] = useState("");

  const load = async () => {
    const q = filter ? `&status=${filter}` : "";
    const res = await fetch(`/api/returns?admin=1${q}`);
    const data = await res.json();
    setRows((data.returns || []) as ReturnRow[]);
  };

  useEffect(() => {
    load();
  }, [filter]);

  const patch = async (id: string, status: string, extra: Record<string, unknown> = {}) => {
    const res = await fetch("/api/returns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, ...extra }),
    });
    const data = await res.json();
    if (!res.ok) toast.error(data.error);
    else {
      toast.success(`Updated to ${status}`);
      load();
    }
  };

  return (
    <div>
      <h1 className="font-serif text-2xl mb-6">Returns</h1>
      <div className="flex gap-2 mb-4">
        {["", "pending", "approved", "received", "refunded", "rejected"].map((s) => (
          <Button key={s || "all"} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}>
            {s || "all"}
          </Button>
        ))}
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="bg-white border border-[#E7E5E4] rounded-lg p-4">
            <p className="font-medium">{r.order_id} · {r.type}</p>
            <p className="text-sm text-[#78716C]">{r.status} — {r.reason}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button size="sm" onClick={() => patch(r.id, "approved")} data-testid="return-approve">Approve</Button>
              <Button size="sm" variant="outline" onClick={() => patch(r.id, "rejected")}>Reject</Button>
              <Button size="sm" variant="outline" onClick={() => patch(r.id, "received", { restock: true })}>Receive+Restock</Button>
              <Button size="sm" variant="outline" onClick={() => patch(r.id, "refunded", { initiate_refund: true })}>Refund</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
