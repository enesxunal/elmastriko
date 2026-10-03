import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BANK_TRANSFER } from "@/lib/payments/bank-transfer";

export async function POST(request: NextRequest) {
  let payload: { orderId?: string; orderNo?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const orderId = String(payload.orderId || "").trim();
  const orderNo = String(payload.orderNo || "").trim();
  if (!orderId || !orderNo) {
    return NextResponse.json({ error: "Sipariş bilgisi eksik." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id,order_no,payment_provider,payment_status,status")
    .eq("id", orderId)
    .eq("order_no", orderNo)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }
  if (order.payment_provider !== BANK_TRANSFER.provider) {
    return NextResponse.json({ error: "Bu sipariş EFT/Havale ödeme yöntemiyle oluşturulmamış." }, { status: 409 });
  }
  if (order.payment_status === "paid") {
    return NextResponse.json({ status: "paid" });
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("id,status,raw_response")
    .eq("order_id", orderId)
    .eq("provider", BANK_TRANSFER.provider)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ error: "EFT ödeme kaydı bulunamadı." }, { status: 404 });
  }

  const previousRaw = (payment.raw_response || {}) as Record<string, unknown>;
  const now = new Date().toISOString();
  const { error: paymentError } = await supabase.from("payments").update({
    status: "customer_notified",
    raw_response: { ...previousRaw, customerNotifiedAt: now },
    updated_at: now,
  }).eq("id", payment.id);

  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  await supabase.from("orders").update({
    payment_status: "customer_notified",
    status: "awaiting_payment",
    updated_at: now,
  }).eq("id", orderId);

  return NextResponse.json({ status: "customer_notified" });
}
