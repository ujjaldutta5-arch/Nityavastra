"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PickupLocation {
  pickup_location?: string;
  name?: string;
  [key: string]: unknown;
}

interface ShiprocketStatus {
  configured?: boolean;
  error?: string | null;
  pickup_locations?: (string | PickupLocation)[];
}

interface PollResult {
  checked?: number;
  updated?: number;
  polled_at?: string | null;
  errors?: unknown[];
}

export default function AdminShiprocketPage() {
  const [status, setStatus] = useState<ShiprocketStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [pollResult, setPollResult] = useState<PollResult | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/webhooks/shiprocket`);
    }
  }, []);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/shiprocket?action=status", {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load status");
      setStatus(data as ShiprocketStatus);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const poll = async () => {
    setPolling(true);
    try {
      const res = await fetch("/api/admin/shiprocket", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "poll" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Poll failed");
      setPollResult(data as PollResult);
      toast.success(`Polled ${data.checked} orders, updated ${data.updated}`);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setPolling(false);
    }
  };

  const copyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success("Webhook URL copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl" data-testid="admin-shiprocket">
      <div>
        <h1 className="font-serif text-3xl text-[#7C1F30]">Shiprocket</h1>
        <p className="text-sm text-[#57534E] mt-1">Shipping integration status</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-[#7C1F30]">Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-[#57534E]">Checking…</p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm">Status:</span>
                <Badge
                  variant={status?.configured && !status?.error ? "default" : "destructive"}
                  data-testid="shiprocket-configured"
                >
                  {!status?.configured
                    ? "Not configured"
                    : status?.error
                      ? "Error"
                      : "Connected"}
                </Badge>
              </div>
              {status?.error && (
                <p className="text-sm text-red-700">{status.error}</p>
              )}
              {status?.pickup_locations && (
                <div className="text-sm text-[#57534E]">
                  <p className="font-medium text-[#2A1508] mb-1">Pickup locations</p>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {(Array.isArray(status.pickup_locations)
                      ? status.pickup_locations
                      : []
                    ).map((loc, i) => (
                      <li key={i}>
                        {typeof loc === "string"
                          ? loc
                          : loc.pickup_location || loc.name || JSON.stringify(loc)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                data-testid="shiprocket-refresh"
                onClick={loadStatus}
              >
                Refresh status
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-[#7C1F30]">Tracking poll</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-[#57534E]">
            Pull latest AWB statuses for open Shiprocket shipments and update orders.
          </p>
          <Button data-testid="shiprocket-poll" onClick={poll} disabled={polling}>
            {polling ? "Polling…" : "Poll now"}
          </Button>
          {pollResult && (
            <p className="text-sm text-[#57534E]" data-testid="shiprocket-poll-result">
              Checked {pollResult.checked}, updated {pollResult.updated}
              {pollResult.polled_at
                ? ` · ${new Date(pollResult.polled_at).toLocaleString("en-IN")}`
                : ""}
              {(pollResult.errors || []).length > 0 &&
                ` · ${pollResult.errors!.length} error(s)`}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-[#7C1F30]">Webhook URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label>Configure this URL in Shiprocket webhooks</Label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={webhookUrl}
              data-testid="shiprocket-webhook-url"
              className="font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              data-testid="shiprocket-copy-webhook"
              onClick={copyWebhook}
            >
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
