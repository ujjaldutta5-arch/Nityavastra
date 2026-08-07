"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

const LOGO =
  "https://customer-assets-lqy194kg.emergentagent.net/job_nityavastra-shop/artifacts/dirh3az1_Updated%20Logo%20Nityavastra.png";

type InvoiceSeller = {
  name: string;
  address: string;
  gstin: string;
  email: string;
  phone: string;
};

type InvoiceItem = {
  product_name?: string;
  name?: string;
  quantity: number;
  unit_price?: number;
  price?: number;
  line_total?: number;
};

type InvoiceOrder = {
  id?: string;
  invoice_number?: string;
  created_at?: string;
  shipping_address?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  };
  customer_name?: string;
  customer_phone?: string;
  items?: InvoiceItem[];
  order_items?: InvoiceItem[];
  tax_igst?: number;
  tax_cgst?: number;
  tax_sgst?: number;
  subtotal?: number;
  taxable_amount?: number;
  shipping_fee?: number;
  total?: number;
};

type InvoiceData = {
  order?: InvoiceOrder;
  seller?: InvoiceSeller;
} & InvoiceOrder;

export default function InvoicePage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [data, setData] = useState<InvoiceData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/orders/${id}/invoice`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "Invoice not available");
        return json as InvoiceData;
      })
      .then(setData)
      .catch((e: unknown) =>
        setErr(e instanceof Error ? e.message : "Invoice not available")
      );
  }, [id]);

  if (err) {
    return (
      <div className="max-w-2xl mx-auto p-10 text-center">
        <p className="text-lg mb-4">{err}</p>
      </div>
    );
  }
  if (!data) {
    return <div className="max-w-2xl mx-auto p-10 text-center">Loading invoice...</div>;
  }

  const order: InvoiceOrder = data.order || data;
  const seller: InvoiceSeller = data.seller || {
    name: "Nityavastra",
    address: "Bhubaneswar, Odisha 751019",
    gstin: "—",
    email: "hello@nityavastra.com",
    phone: "+91 87777 87700",
  };
  const addr = order.shipping_address || {};
  const items: InvoiceItem[] = order.items || order.order_items || [];
  const sameState = (order.tax_igst || 0) === 0;

  return (
    <div className="bg-[#FAF3E7] min-h-screen py-10 print:py-0 print:bg-white">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          <Button
            variant="outline"
            onClick={() => window.print()}
            data-testid="print-invoice-btn"
            className="rounded-full"
          >
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button
            onClick={() => window.print()}
            data-testid="download-invoice-btn"
            className="rounded-full bg-[#7C1F30] hover:bg-[#8D2A3D]"
          >
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </div>

        <div
          className="bg-white shadow-sm border border-[#E7E5E4] print:border-0 print:shadow-none rounded-md p-8 md:p-10"
          data-testid="invoice-body"
        >
          <div className="flex items-start justify-between border-b border-[#E7E5E4] pb-6 mb-6">
            <div className="flex gap-4">
              <Image src={LOGO} alt="Nityavastra" width={64} height={64} className="rounded-full" />
              <div>
                <div className="font-serif text-2xl text-[#2A1508]">{seller.name}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#B8871E] mt-0.5">
                  Sacred Weaves · Everyday Grace
                </div>
                <div className="text-xs text-[#78716C] mt-2 max-w-xs">
                  {seller.address}
                  <br />
                  GSTIN: <span className="font-mono">{seller.gstin}</span>
                  <br />
                  {seller.email} · {seller.phone}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="uppercase text-xs tracking-[0.2em] text-[#7C1F30] font-medium mb-1">
                Tax Invoice
              </div>
              <div className="text-lg font-mono font-medium">
                {order.invoice_number || order.id}
              </div>
              <div className="text-xs text-[#78716C] mt-1">
                Date:{" "}
                {order.created_at
                  ? new Date(order.created_at).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <div className="uppercase text-[10px] tracking-[0.2em] text-[#78716C] mb-2">
                Billed To
              </div>
              <div className="text-sm">
                <div className="font-medium">{addr.name || order.customer_name || "—"}</div>
                <div className="text-[#2A1508]/80">{addr.address || (addr as { line1?: string }).line1}</div>
                <div className="text-[#2A1508]/80">
                  {addr.city}
                  {addr.state ? `, ${addr.state}` : ""} {addr.pincode ? `- ${addr.pincode}` : ""}
                </div>
                <div className="text-[#78716C] mt-1">{addr.phone || order.customer_phone}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="uppercase text-[10px] tracking-[0.2em] text-[#78716C] mb-2">
                Place of Supply
              </div>
              <div className="text-sm font-medium">{addr.state || "—"}</div>
              <div className="text-xs text-[#78716C] mt-2">
                {sameState ? "Intra-state (CGST + SGST)" : "Inter-state (IGST)"}
              </div>
            </div>
          </div>

          <div className="mb-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF3E7]">
                <tr className="text-left border-b border-[#E7E5E4]">
                  <th className="px-3 py-2 font-medium">Item</th>
                  <th className="px-3 py-2 font-medium text-right">Qty</th>
                  <th className="px-3 py-2 font-medium text-right">Rate</th>
                  <th className="px-3 py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} className="border-b border-[#E7E5E4]">
                    <td className="px-3 py-2">{it.product_name || it.name}</td>
                    <td className="px-3 py-2 text-right">{it.quantity}</td>
                    <td className="px-3 py-2 text-right">
                      {formatINR(it.unit_price || it.price)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatINR(it.line_total || (it.unit_price || it.price || 0) * it.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-full md:w-80 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#78716C]">Subtotal</span>
                <span>{formatINR(order.subtotal || order.taxable_amount)}</span>
              </div>
              {sameState ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#78716C]">CGST</span>
                    <span>{formatINR(order.tax_cgst || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#78716C]">SGST</span>
                    <span>{formatINR(order.tax_sgst || 0)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-[#78716C]">IGST</span>
                  <span>{formatINR(order.tax_igst || 0)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#78716C]">Shipping</span>
                <span>
                  {(order.shipping_fee || 0) === 0 ? "Free" : formatINR(order.shipping_fee)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#E7E5E4] pt-2 mt-2 text-base font-medium">
                <span>Grand Total</span>
                <span>{formatINR(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[#E7E5E4] text-xs text-[#78716C] text-center leading-relaxed">
            This is a computer-generated invoice and does not require a signature.
            <br />
            Thank you for shopping with {seller.name} — Sacred Weaves · Everyday Grace.
          </div>
        </div>
      </div>
    </div>
  );
}
