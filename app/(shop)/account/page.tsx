"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { Order, ReturnRequest } from "@/types";

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrders((d.orders || []) as Order[]))
      .catch(() => {});
    fetch("/api/returns")
      .then((r) => r.json())
      .then((d) => setReturns((d.returns || []) as ReturnRequest[]))
      .catch(() => {});
  }, [user]);

  const requestReturn = async (orderId: string) => {
    const reason = prompt("Reason for return?");
    if (!reason) return;
    const res = await fetch("/api/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId, type: "return", reason }),
    });
    const data = await res.json();
    if (!res.ok) toast.error(data.error);
    else {
      toast.success("Return requested");
      setReturns((r) => [data.return as ReturnRequest, ...r]);
    }
  };

  if (loading) return <div className="py-20 text-center">Loading…</div>;
  if (!user) return <div className="py-20 text-center"><Link href="/login">Login</Link></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 md:py-16">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl">Account</h1>
          <p className="text-[#78716C] mt-1">{user.name || user.email || user.phone}</p>
        </div>
        <Button variant="outline" onClick={logout} data-testid="logout-btn">
          Logout
        </Button>
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="space-y-4 mt-6">
          {orders.length === 0 && <p className="text-[#78716C]">No orders yet.</p>}
          {orders.map((o) => (
            <div key={o.id} className="border border-[#E7E5E4] rounded-lg p-4 bg-white" data-testid="order-row">
              <div className="flex justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-medium">{o.id}</p>
                  <p className="text-sm text-[#78716C]">
                    {o.status} · {o.payment_status} · {formatINR(o.total)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/invoice/${o.id}`}>Invoice</Link>
                  </Button>
                  {["shipped", "delivered"].includes(o.status) && (
                    <Button size="sm" variant="outline" onClick={() => requestReturn(o.id)}>
                      Return
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="returns" className="mt-6 space-y-3">
          {returns.length === 0 && <p className="text-[#78716C]">No returns.</p>}
          {returns.map((r) => (
            <div key={r.id} className="border border-[#E7E5E4] rounded-lg p-4">
              <p className="font-medium">{r.order_id}</p>
              <p className="text-sm text-[#78716C]">
                {r.type} · {r.status} · {r.reason}
              </p>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
