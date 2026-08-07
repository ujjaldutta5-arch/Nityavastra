"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Message sent — we will reply soon");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send message";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-8 py-16">
      <h1 className="font-serif text-3xl mb-2">Contact</h1>
      <p className="text-[#78716C] mb-8">+91-87777-87700 · Bhubaneswar, Odisha</p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="contact-name" />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="contact-email" />
        </div>
        <div>
          <Label>Subject</Label>
          <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        </div>
        <div>
          <Label>Message</Label>
          <Textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} data-testid="contact-message" />
        </div>
        <Button type="submit" disabled={loading} className="bg-[#7C1F30] text-white" data-testid="contact-submit">
          Send message
        </Button>
      </form>
    </div>
  );
}
