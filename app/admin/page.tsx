"use client";

import { useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
}

interface DashboardStats {
  revenue?: number;
  orders?: number;
  products?: number;
  low_stock?: LowStockProduct[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/stats", { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load stats");
        setStats(data as DashboardStats);
      } catch (e: unknown) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p className="text-[#57534E]">Loading dashboard…</p>;
  if (error) return <p className="text-red-700">{error}</p>;

  return (
    <div className="space-y-8" data-testid="admin-dashboard">
      <div>
        <h1 className="font-serif text-3xl text-[#7C1F30]">Dashboard</h1>
        <p className="text-sm text-[#57534E] mt-1">Store overview and inventory alerts</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#57534E]">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-2xl text-[#7C1F30]" data-testid="stat-revenue">
              {formatINR(stats?.revenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#57534E]">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-2xl text-[#7C1F30]" data-testid="stat-orders">
              {stats?.orders ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#57534E]">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-2xl text-[#7C1F30]" data-testid="stat-products">
              {stats?.products ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="font-serif text-xl text-[#7C1F30] mb-3">Low stock</h2>
        {(stats?.low_stock || []).length === 0 ? (
          <p className="text-sm text-[#57534E]">All products have stock above 5.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#7C1F30]/15 bg-white">
            <table className="w-full text-sm" data-testid="low-stock-table">
              <thead className="bg-[#FAF3E7] text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Product</th>
                  <th className="px-4 py-2 font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {stats!.low_stock!.map((p) => (
                  <tr key={p.id} className="border-t border-[#7C1F30]/10">
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2">
                      <Badge variant={p.stock <= 0 ? "destructive" : "secondary"}>
                        {p.stock}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
