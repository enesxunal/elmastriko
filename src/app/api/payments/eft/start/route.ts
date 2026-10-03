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
  const { data: order, error } = await supabase
    .from("orders")
    .select("id,order_no,grand_total,currency,payment_status,status")
    .eq("id", orderId)
    .eq("order_no", orderNo)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }
  if (order.payment_status === "paid") {
    return NextResponse.json({ error: "Bu sipariş zaten ödenmiş." }, { status: 409 });
  }

  const { data: existing } = await supabase
    .from("payments")
    .select("id,status")
    .eq("order_id", orderId)
    .eq("provider", BANK_TRANSFER.provider)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const paymentPayload = {
    order_id: orderId,
    provider: BANK_TRANSFER.provider,
    provider_reference: orderNo,
    amount: Number(order.grand_total),
    status: existing?.status === "customer_notified" ? "customer_notified" : "pending",
    raw_response: {
      bankName: BANK_TRANSFER.bankName,
      accountHolder: BANK_TRANSFER.accountHolder,
      iban: BANK_TRANSFER.iban,
      reference: orderNo,
    },
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    await supabase.from("payments").update(paymentPayload).eq("id", existing.id);
  } else {
    const { error: insertError } = await supabase.from("payments").insert(paymentPayload);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  await supabase.from("orders").update({
    payment_provider: BANK_TRANSFER.provider,
    payment_status: paymentPayload.status,
    status: "awaiting_payment",
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);

  return NextResponse.json({
    orderId,
    orderNo,
    status: paymentPayload.status,
    bank: {
      name: BANK_TRANSFER.bankName,
      accountHolder: BANK_TRANSFER.accountHolder,
      iban: BANK_TRANSFER.iban,
    },
  });
}
