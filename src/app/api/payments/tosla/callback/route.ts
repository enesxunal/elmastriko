import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tosla, validateToslaCallback } from "@/lib/integrations/tosla";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const payload: Record<string, string> = {};
  form.forEach((value, key) => {
    if (typeof value === "string") payload[key] = value;
  });

  if (!validateToslaCallback(payload)) {
    return NextResponse.json({ error: "Invalid callback hash." }, { status: 400 });
  }

  const orderNo = payload.OrderId || payload.orderId || "";
  const threeDSessionId = payload.ThreeDSessionId || payload.threeDSessionId || "";
  if (!orderNo) {
    return NextResponse.json({ error: "OrderId is missing." }, { status: 400 });
  }

  let providerResult: Record<string, unknown> = payload;
  if (threeDSessionId) {
    try {
      providerResult = await tosla.threeDSessionResult(threeDSessionId);
    } catch {
      providerResult = payload;
    }
  }

  const bankCode = String(
    providerResult.BankResponseCode ||
    providerResult.bankResponseCode ||
    payload.BankResponseCode ||
    ""
  );
  const paid = bankCode === "00";

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("order_no", orderNo)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const paymentUpdate = {
    status: paid ? "paid" : "failed",
    raw_response: { callback: payload, result: providerResult },
    updated_at: new Date().toISOString(),
  };

  if (threeDSessionId) {
    await supabase
      .from("payments")
      .update(paymentUpdate)
      .eq("order_id", order.id)
      .eq("provider_reference", threeDSessionId);
  } else {
    await supabase
      .from("payments")
      .update(paymentUpdate)
      .eq("order_id", order.id)
      .eq("provider", "tosla");
  }

  await supabase
    .from("orders")
    .update({
      payment_provider: "tosla",
      payment_status: paid ? "paid" : "failed",
      status: paid ? "paid" : "awaiting_payment",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://elmastriko.com").replace(/\/$/, "");
  const target = paid
    ? `${siteUrl}/checkout?payment=success&order=${encodeURIComponent(orderNo)}`
    : `${siteUrl}/checkout?payment=failed&order=${encodeURIComponent(orderNo)}`;

  return NextResponse.redirect(target, 303);
}
