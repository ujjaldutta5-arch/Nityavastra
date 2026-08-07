"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Order } from "@/types";

const NEXT_STATUS: Record<string, string> = {
  pending: "confirmed",
  cod_pending: "confirmed",
  confirmed: "shipped",
  shipped: "delivered",
};

interface AdminOrder extends Order {
  created_at?: string | null;
  order_items?: unknown[];
  customer_name?: string | null;
  shipping_name?: string | null;
  customer_email?: string | null;
  email?: string | null;
  payment_method?: string | null;
  tracking_number?: string | null;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load orders");
      setOrders((data.orders || []) as AdminOrder[]);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setRowBusy = (id: string, v: boolean) => setBusy((b) => ({ ...b, [id]: v }));

  const patchOrder = async (id: string, body: Record<string, unknown>) => {
    setRowBusy(id, true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      toast.success("Order updated");
      load();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setRowBusy(id, false);
    }
  };

  const ship = async (orderId: string) => {
    setRowBusy(orderId, true);
    try {
      const res = await fetch("/api/admin/shiprocket", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ship", order_id: orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ship failed");
      toast.success("Shipment created");
      load();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setRowBusy(orderId, false);
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-orders">
      <div>
        <h1 className="font-serif text-3xl text-[#7C1F30]">Orders</h1>
        <p className="text-sm text-[#57534E] mt-1">Fulfillment, refunds, and shipping</p>
      </div>

      {loading ? (
        <p className="text-sm text-[#57534E]">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#7C1F30]/15 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF3E7] text-left">
              <tr>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Payment</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const next = NEXT_STATUS[o.status];
                const disabled = busy[o.id];
                return (
                  <tr key={o.id} className="border-t border-[#7C1F30]/10 align-top">
                    <td className="px-3 py-2">
                      <div className="font-medium">{o.id}</div>
                      <div className="text-xs text-[#57534E]">
                        {o.created_at ? new Date(o.created_at).toLocaleString("en-IN") : ""}
                      </div>
                      <div className="text-xs text-[#57534E] mt-1">
                        {(o.order_items || []).length} item(s)
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div>{o.customer_name || o.shipping_name || "—"}</div>
                      <div className="text-xs text-[#57534E]">{o.customer_email || o.email}</div>
                    </td>
                    <td className="px-3 py-2">{formatINR(o.total)}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline">{o.payment_status}</Badge>
                      <div className="text-xs mt-1">{o.payment_method}</div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge>{o.status}</Badge>
                      {o.tracking_number && (
                        <div className="text-xs mt-1 text-[#57534E]">AWB: {o.tracking_number}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 space-y-1 min-w-[180px]">
                      {next && (
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={disabled}
                          data-testid={`order-advance-${o.id}`}
                          onClick={() => patchOrder(o.id, { status: next })}
                        >
                          Mark {next}
                        </Button>
                      )}
                      {!["shipped", "delivered", "cancelled", "refunded", "rto"].includes(o.status) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full"
                          disabled={disabled}
                          data-testid={`order-ship-${o.id}`}
                          onClick={() => ship(o.id)}
                        >
                          Ship
                        </Button>
                      )}
                      {o.payment_status !== "refunded" && o.status !== "refunded" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full"
                          disabled={disabled}
                          data-testid={`order-refund-${o.id}`}
                          onClick={() => {
                            if (confirm("Refund this order?")) patchOrder(o.id, { refund: true });
                          }}
                        >
                          Refund
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!orders.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-[#57534E]">
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
