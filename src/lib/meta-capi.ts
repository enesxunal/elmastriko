import { createHash } from "node:crypto";
import { createAdminClient } from "./supabase/admin";

const PIXEL_ID = "1474952207810125";
const hash = (value: string) => createHash("sha256").update(value.trim().toLowerCase()).digest("hex");

export async function sendMetaPurchase(order: {
  id: string; grand_total: number; currency?: string | null;
  guest_email?: string | null; guest_phone?: string | null;
}, eventTime = Math.floor(Date.now() / 1000)) {
  if (/@example\.invalid$/i.test(order.guest_email || "")) return false;
  const { data: verified, error } = await createAdminClient().from("orders")
    .select("is_test,archived_at,payment_status,status,paid_at").eq("id", order.id).maybeSingle();
  if (error || !verified || verified.is_test || verified.archived_at || verified.payment_status !== "paid" || ["cancelled", "refunded", "returned"].includes(verified.status)) return false;
  if (verified.paid_at) eventTime = Math.floor(new Date(verified.paid_at).getTime() / 1000);
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!token) { console.warn("Meta CAPI token missing"); return false; }
  const user_data: Record<string, string> = {};
  if (order.guest_email) user_data.em = hash(order.guest_email);
  if (order.guest_phone) {
    const phone = order.guest_phone.replace(/\D/g, "");
    if (phone) user_data.ph = hash(phone.startsWith("0") ? "90" + phone.slice(1) : phone);
  }
  if (!Object.keys(user_data).length) {
    console.warn("Meta CAPI purchase skipped: no match data");
    return false;
  }
  const payload = {
    data: [{
      event_name: "Purchase", event_time: eventTime,
      event_id: "purchase_" + order.id,
      action_source: "website",
      event_source_url: "https://www.elmastriko.com/siparis-basarili",
      user_data,
      custom_data: { currency: order.currency || "TRY", value: Number(order.grand_total), order_id: order.id },
    }],
  };
  try {
    const response = await fetch(`https://graph.facebook.com/v23.0/${PIXEL_ID}/events`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) { console.error("Meta CAPI request failed", response.status); return false; }
    return true;
  } catch (error) {
    console.error("Meta CAPI transport failed", error instanceof Error ? error.name : "unknown");
    return false;
  }
}
