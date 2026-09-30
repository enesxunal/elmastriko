import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tosla, validateToslaCallback } from "@/lib/integrations/tosla";
import { isNesConfigured } from "@/lib/integrations/invoice";
import { createNesInvoiceForOrder } from "@/lib/integrations/nes-order-invoice";

function responseValue(payload: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (value !== undefined && value !== null && String(value) !== "") return String(value);
  }
  return "";
}

function providerAmountMatches(payload: Record<string, unknown>, expectedTry: number) {
  const raw = responseValue(payload, "Amount", "amount");
  if (!raw) return true;

  const amount = Number(raw);
  if (!Number.isFinite(amount)) return false;

  const expectedMinor = Math.round(expectedTry * 100);
  return Math.round(amount) === expectedMinor;
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const payload: Record<string, string> = {};
  form.forEach((value, key) => {
    if (typeof value === "string") payload[key] = value;
  });

  if (!validateToslaCallback(payload)) {
    return NextResponse.json({ error: "Invalid callback hash." }, { status: 400 });
  }

  const providerOrderId = payload.OrderId || payload.orderId || "";
  const threeDSessionId = payload.ThreeDSessionId || payload.threeDSessionId || "";
  if (!providerOrderId) {
    return NextResponse.json({ error: "OrderId is missing." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("id,order_id,provider_reference")
    .eq("provider", "tosla")
    .eq("provider_reference", providerOrderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id,order_no,grand_total,payment_status")
    .eq("id", payment.order_id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  let providerResult: Record<string, unknown> | null = null;
  let verificationError: string | null = null;

  if (threeDSessionId) {
    try {
      providerResult = await tosla.threeDSessionResult(threeDSessionId);
    } catch (error) {
      verificationError = error instanceof Error ? error.message : "threeDSessionResult failed";
    }
  }

  if (!providerResult) {
    try {
      providerResult = await tosla.inquiry(providerOrderId);
      verificationError = null;
    } catch (error) {
      verificationError = error instanceof Error ? error.message : "inquiry failed";
    }
  }

  const verified = Boolean(providerResult);
  const result = providerResult || payload;
  const bankCode = responseValue(result, "BankResponseCode", "bankResponseCode") ||
    payload.BankResponseCode ||
    "";
  const resultOrderNo = responseValue(result, "OrderId", "orderId");
  const orderMatches = !resultOrderNo || resultOrderNo === providerOrderId;
  const amountMatches = providerAmountMatches(result, Number(order.grand_total));
  const paid = verified && bankCode === "00" && orderMatches && amountMatches;
  const failed = verified && bankCode !== "00";

  const paymentStatus = paid ? "paid" : failed ? "failed" : "pending";
  const paymentUpdate = {
    status: paymentStatus,
    raw_response: {
      callback: payload,
      result,
      verification: {
        verified,
        orderMatches,
        amountMatches,
        error: verificationError,
      },
      providerOrderId,
      threeDSessionId,
    },
    updated_at: new Date().toISOString(),
  };

  await supabase
    .from("payments")
    .update(paymentUpdate)
    .eq("id", payment.id);

  if (order.payment_status !== "paid") {
    await supabase
      .from("orders")
      .update({
        payment_provider: "tosla",
        payment_status: paymentStatus,
        status: paid ? "paid" : "awaiting_payment",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);
  }

  if (paid && isNesConfigured()) {
    try {
      await createNesInvoiceForOrder(order.id);
    } catch (invoiceError) {
      console.error("NES invoice creation failed after payment:", invoiceError);
    }
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.elmastriko.com").replace(/\/$/, "");
  const target = paid
    ? `${siteUrl}/siparis-basarili?order=${encodeURIComponent(order.order_no)}`
    : `${siteUrl}/checkout?payment=${failed ? "failed" : "pending"}&order=${encodeURIComponent(order.order_no)}`;

  return NextResponse.redirect(target, 303);
}
