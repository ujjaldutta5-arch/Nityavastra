"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { STAFF_ROLES } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Profile, StaffRole } from "@/types";

interface StaffForm {
  email: string;
  password: string;
  name: string;
  role: StaffRole;
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<StaffForm>({
    email: "",
    password: "",
    name: "",
    role: "order_manager",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setStaff((data.staff || []) as Profile[]);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      toast.success("Staff created");
      setOpen(false);
      setForm({ email: "", password: "", name: "", role: "order_manager" });
      load();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const patch = async (id: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      toast.success("Updated");
      load();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove staff access (role → customer)?")) return;
    try {
      const res = await fetch(`/api/admin/staff?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast.success("Removed");
      load();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-staff">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-[#7C1F30]">Staff</h1>
          <p className="text-sm text-[#57534E] mt-1">Roles & access</p>
        </div>
        <Button data-testid="staff-create" onClick={() => setOpen(true)}>
          Add staff
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-[#57534E]">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#7C1F30]/15 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF3E7] text-left">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-t border-[#7C1F30]/10">
                  <td className="px-3 py-2">{s.name || "—"}</td>
                  <td className="px-3 py-2">{s.email}</td>
                  <td className="px-3 py-2">
                    <select
                      className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                      value={s.role}
                      data-testid={`staff-role-${s.id}`}
                      onChange={(e) => patch(s.id, { role: e.target.value })}
                    >
                      {STAFF_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={s.banned ? "destructive" : "default"}>
                      {s.banned ? "Banned" : "Active"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`staff-ban-${s.id}`}
                      onClick={() => patch(s.id, { banned: !s.banned })}
                    >
                      {s.banned ? "Unban" : "Ban"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      data-testid={`staff-delete-${s.id}`}
                      onClick={() => remove(s.id)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#FAF3E7]">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#7C1F30]">Add staff</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                data-testid="staff-form-name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                data-testid="staff-form-email"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                data-testid="staff-form-password"
              />
            </div>
            <div>
              <Label>Role</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
                data-testid="staff-form-role"
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button data-testid="staff-form-save" onClick={create} disabled={saving}>
              {saving ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
