"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BestSeller {
  product_id?: string | null;
  name?: string | null;
  qty?: number | null;
  revenue?: number | null;
}

interface SalesReport {
  total_revenue?: number;
  orders?: number;
  aov?: number;
  return_rate?: number;
  refund_count?: number;
  gst?: {
    taxable?: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
  };
  best_sellers?: BestSeller[];
}

export default function AdminReportsPage() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [category, setCategory] = useState("");
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(false);

  const qs = () => {
    const p = new URLSearchParams();
    if (start) p.set("start_date", start);
    if (end) p.set("end_date", end);
    if (category) p.set("category", category);
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/sales${qs()}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load report");
      setReport(data as SalesReport);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const query = qs();
  const csvHref = `/api/admin/reports/sales${query}${query ? "&" : "?"}format=csv`;

  return (
    <div className="space-y-6" data-testid="admin-reports">
      <div>
        <h1 className="font-serif text-3xl text-[#7C1F30]">Reports</h1>
        <p className="text-sm text-[#57534E] mt-1">Sales performance</p>
      </div>

      <div className="rounded-lg border border-[#7C1F30]/15 bg-white p-4 flex flex-wrap gap-3 items-end">
        <div>
          <Label>Start date</Label>
          <Input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            data-testid="report-start"
          />
        </div>
        <div>
          <Label>End date</Label>
          <Input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            data-testid="report-end"
          />
        </div>
        <div>
          <Label>Category</Label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="sarees"
            data-testid="report-category"
          />
        </div>
        <Button data-testid="report-run" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Run report"}
        </Button>
        <Button asChild variant="outline" data-testid="report-csv">
          <a href={csvHref}>Download CSV</a>
        </Button>
      </div>

      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#57534E]">Revenue</CardTitle>
              </CardHeader>
              <CardContent className="font-serif text-xl text-[#7C1F30]">
                {formatINR(report.total_revenue)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#57534E]">Orders</CardTitle>
              </CardHeader>
              <CardContent className="font-serif text-xl text-[#7C1F30]">
                {report.orders}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#57534E]">AOV</CardTitle>
              </CardHeader>
              <CardContent className="font-serif text-xl text-[#7C1F30]">
                {formatINR(report.aov)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#57534E]">Return rate</CardTitle>
              </CardHeader>
              <CardContent className="font-serif text-xl text-[#7C1F30]">
                {(report.return_rate || 0).toFixed(1)}%
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-[#7C1F30]/15 bg-white p-4">
              <h2 className="font-serif text-lg text-[#7C1F30] mb-2">GST summary</h2>
              <ul className="text-sm space-y-1 text-[#57534E]">
                <li>Taxable: {formatINR(report.gst?.taxable)}</li>
                <li>CGST: {formatINR(report.gst?.cgst)}</li>
                <li>SGST: {formatINR(report.gst?.sgst)}</li>
                <li>IGST: {formatINR(report.gst?.igst)}</li>
                <li>Refunds: {report.refund_count}</li>
              </ul>
            </div>
            <div className="rounded-lg border border-[#7C1F30]/15 bg-white p-4">
              <h2 className="font-serif text-lg text-[#7C1F30] mb-2">Best sellers</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#57534E]">
                    <th className="py-1">Product</th>
                    <th className="py-1">Qty</th>
                    <th className="py-1">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {(report.best_sellers || []).map((b) => (
                    <tr key={b.product_id || b.name || undefined} className="border-t border-[#7C1F30]/10">
                      <td className="py-1">{b.name}</td>
                      <td className="py-1">{b.qty}</td>
                      <td className="py-1">{formatINR(b.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
