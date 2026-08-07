"use client";

import { useState } from "react";
import { Truck, CheckCircle2, XCircle } from "lucide-react";

type PincodeResult = {
  error?: string;
  serviceable?: boolean;
  eta?: string;
  courier?: string;
};

export default function PincodeCheck({ weightKg = 0.5 }: { weightKg?: number }) {
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<PincodeResult | null>(null);
  const [checking, setChecking] = useState(false);

  const check = async () => {
    if (!/^\d{6}$/.test(pin)) {
      setResult({ error: "Enter a valid 6-digit PIN code" });
      return;
    }
    setChecking(true);
    setResult(null);
    try {
      const res = await fetch(
        `/api/pincode-check?pincode=${pin}&weight=${weightKg}`
      );
      const data = await res.json();
      if (!res.ok) {
        setResult({ error: data.error || "Could not check delivery" });
      } else if (data.serviceable === false) {
        setResult({ error: data.message || "Not deliverable to this PIN" });
      } else {
        setResult({
          serviceable: true,
          eta: data.eta || data.estimated_days || "3-5 days",
          courier: data.courier || data.courier_name || "Standard Delivery",
        });
      }
    } catch {
      setResult({ error: "Could not check delivery. Try again." });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      className="border border-[#E7E5E4] rounded-md p-3 bg-[#FAF3E7]"
      data-testid="pincode-check"
    >
      <div className="flex items-center gap-2 mb-2">
        <Truck className="h-4 w-4 text-[#7C1F30]" />
        <span className="text-sm font-medium">Delivery availability</span>
      </div>
      <div className="flex gap-2">
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="Enter 6-digit PIN"
          className="h-9 flex-1 rounded-md border border-[#E7E5E4] bg-white px-3 text-sm"
          data-testid="pincode-input"
          maxLength={6}
        />
        <button
          onClick={check}
          disabled={checking}
          data-testid="pincode-check-btn"
          className="bg-[#7C1F30] hover:bg-[#8D2A3D] text-white text-sm px-4 rounded-full disabled:opacity-50"
        >
          {checking ? "..." : "Check"}
        </button>
      </div>
      {result && (
        <div className="mt-3 text-xs">
          {result.error && (
            <div className="text-red-600 flex items-center gap-1" data-testid="pincode-err">
              <XCircle className="h-3.5 w-3.5" />
              {result.error}
            </div>
          )}
          {result.serviceable && (
            <div className="text-green-800 flex items-start gap-1" data-testid="pincode-ok">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <div>
                Delivers to <strong>{pin}</strong> in <strong>{result.eta}</strong>
                {result.courier && (
                  <div className="text-[#78716C]">via {result.courier}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
