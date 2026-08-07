"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type CrmTicket = {
  id: string;
  subject?: string;
  email?: string;
  status?: string;
};

type CrmNotification = {
  id: string;
  channel?: string;
  event?: string;
  recipient?: string;
  status?: string;
};

type CrmAbandoned = {
  id: string;
  email?: string;
  phone?: string;
  user_id?: string;
  total?: number;
  recovered?: boolean;
};

type CrmData = {
  tickets?: CrmTicket[];
  notifications?: CrmNotification[];
  abandoned?: CrmAbandoned[];
};

export default function AdminCrmPage() {
  const [tab, setTab] = useState("tickets");
  const [data, setData] = useState<CrmData>({});
  const [reply, setReply] = useState<Record<string, string>>({});

  const load = async () => {
    const res = await fetch(`/api/admin/crm?tab=${tab}`);
    setData((await res.json()) as CrmData);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div>
      <h1 className="font-serif text-2xl mb-6">CRM</h1>
      <div className="flex gap-2 mb-6">
        {["tickets", "notifications", "abandoned"].map((t) => (
          <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>
            {t}
          </Button>
        ))}
      </div>

      {tab === "tickets" &&
        (data.tickets || []).map((t) => (
          <div key={t.id} className="bg-white border rounded-lg p-4 mb-3">
            <p className="font-medium">{t.subject}</p>
            <p className="text-sm text-[#78716C]">
              {t.email} · {t.status}
            </p>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Reply"
                value={reply[t.id] || ""}
                onChange={(e) => setReply({ ...reply, [t.id]: e.target.value })}
              />
              <Button
                size="sm"
                onClick={async () => {
                  const res = await fetch("/api/admin/crm", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: t.id, reply: reply[t.id], status: "replied" }),
                  });
                  if (!res.ok) toast.error("Failed");
                  else {
                    toast.success("Replied");
                    load();
                  }
                }}
              >
                Send
              </Button>
            </div>
          </div>
        ))}

      {tab === "notifications" &&
        (data.notifications || []).map((n) => (
          <div key={n.id} className="text-sm border-b py-2">
            [{n.channel}] {n.event} → {n.recipient} · {n.status}
          </div>
        ))}

      {tab === "abandoned" &&
        (data.abandoned || []).map((a) => (
          <div key={a.id} className="border rounded p-3 mb-2 text-sm">
            {a.email || a.phone || a.user_id} · ₹{a.total} · recovered={String(a.recovered)}
          </div>
        ))}
    </div>
  );
}
