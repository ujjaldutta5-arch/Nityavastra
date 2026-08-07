import { createAdminClient } from "@/lib/supabase/admin";
import type { Order } from "@/types";

export type NotificationChannel = "email" | "sms" | string;

export async function queueNotification({
  channel = "email",
  event,
  recipient,
  subject = "",
  body = "",
  user_id = null,
}: {
  channel?: NotificationChannel;
  event: string;
  recipient: string;
  subject?: string;
  body?: string;
  user_id?: string | null;
}) {
  const admin = createAdminClient();
  const row = {
    channel,
    event,
    recipient,
    subject,
    body,
    user_id,
    status: "logged",
  };

  console.log("[notification]", channel, event, recipient, subject);

  try {
    await admin.from("notifications").insert(row);
  } catch (e) {
    console.error("notification insert failed", e);
  }

  return row;
}

export async function notifyOrderEvent(
  order: Order & {
    customer_email?: string | null;
    customer_phone?: string | null;
  },
  event: string
) {
  const subjectMap: Record<string, string> = {
    order_placed: `Order ${order.id} confirmed`,
    order_shipped: `Order ${order.id} shipped`,
    order_delivered: `Order ${order.id} delivered`,
    order_refunded: `Refund for order ${order.id}`,
  };
  const subject = subjectMap[event] || `Update on order ${order.id}`;
  const body = `${subject}. Total: ₹${order.total}. Status: ${order.status}.`;
  if (order.customer_email) {
    await queueNotification({
      channel: "email",
      event,
      recipient: order.customer_email,
      subject,
      body,
      user_id: order.user_id ?? null,
    });
  }
  if (order.customer_phone) {
    await queueNotification({
      channel: "sms",
      event,
      recipient: order.customer_phone,
      subject: "",
      body,
      user_id: order.user_id ?? null,
    });
  }
}
