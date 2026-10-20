import { CARD_COOKIE, signCardSession } from "@/lib/payments/card-session";
import { recordCheckoutEvent } from "@/lib/checkout-diagnostics-server";
import { UUID, type CheckoutDiagnosticContext } from "@/lib/checkout-diagnostics";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isToslaConfigured, tosla } from "@/lib/integrations/tosla";

function providerOrderId(orderId: string) {
  return "ET" + orderId.replace(/-/g, "").slice(0, 16).toUpperCase();
}

export async function POST(request: NextRequest) {
  let body: { orderId?: string; email?: string; installmentCount?: number; diagnostics?: CheckoutDiagnosticContext };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (!isToslaConfigured()) {
    await recordCheckoutEvent("payment_session_failed", body.diagnostics, { code: "provider", isTest: /@example\.invalid$/i.test(body.email || "") });
    return NextResponse.json({ error: "Kart ödemesi şu anda başlatılamıyor. Lütfen daha sonra tekrar deneyin." }, { status: 503 });
  }

  if (!body.orderId || !body.email) {
    return NextResponse.json({ error: "Sipariş ve e-posta bilgisi gerekli." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id,order_no,guest_email,grand_total,currency,payment_status,status")
    .eq("id", body.orderId)
    .maybeSingle();

  if (!order || String(order.guest_email || "").toLowerCase() !== body.email.trim().toLowerCase()) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }

  if (order.currency !== "TRY" || Number(order.grand_total) <= 0) {
    return NextResponse.json({ error: "Sipariş tutarı ödeme için uygun değil." }, { status: 409 });
  }

  if (["cancelled", "refunded"].includes(order.status)) return NextResponse.json({ error: "Bu sipariş ödeme için kapalı." }, { status: 409 });

  if (order.payment_status === "paid") {
    return NextResponse.json({ error: "Bu sipariş zaten ödendi." }, { status: 409 });
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.elmastriko.com").replace(/\/$/, "");
  const toslaOrderId = providerOrderId(order.id);
  let result;
  try {
    result = await tosla.startHostedThreeD({
      callbackUrl: siteUrl + "/api/payments/tosla/callback",
      orderId: toslaOrderId,
      amountTry: Number(order.grand_total),
      installmentCount: Math.max(0, Math.min(12, Number(body.installmentCount || 0))),
    });
  } catch (error) {
    console.error("Tosla payment session start failed", error instanceof Error ? error.name : "unknown");
    await recordCheckoutEvent("payment_session_failed", body.diagnostics, { orderId: order.id, code: "provider", isTest: /@example\.invalid$/i.test(order.guest_email || "") });
    return NextResponse.json(
      { error: "Tosla ödeme oturumu başlatılamadı. Lütfen tekrar deneyin." },
      { status: 502 }
    );
  }

  const sessionId = String(result.ThreeDSessionId || "");
  if (!sessionId) {
    await recordCheckoutEvent("payment_session_failed", body.diagnostics, { orderId: order.id, code: "provider", isTest: /@example\.invalid$/i.test(order.guest_email || "") });
    return NextResponse.json({ error: "Tosla 3D oturumu oluşturulamadı." }, { status: 502 });
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    order_id: order.id,
    provider: "tosla",
    provider_reference: toslaOrderId,
    amount: order.grand_total,
    status: "pending",
    raw_response: {
      ...result,
      providerOrderId: toslaOrderId,
      threeDSessionId: sessionId,
    },
  });

  if (paymentError) {
    await recordCheckoutEvent("payment_session_failed", body.diagnostics, { orderId: order.id, code: "database" });
    return NextResponse.json({ error: "Ödeme kaydı oluşturulamadı. Lütfen tekrar deneyin." }, { status: 503 });
  }

  const { error: orderError } = await supabase
    .from("orders")
    .update({
      payment_provider: "tosla",
      payment_status: "pending",
      status: "awaiting_payment",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (orderError) return NextResponse.json({ error: "Sipariş ödeme durumu kaydedilemedi." }, { status: 503 });
  const isTest = /@example\.invalid$/i.test(order.guest_email || "");
  await recordCheckoutEvent("payment_session_created", body.diagnostics, { orderId: order.id, isTest });
  const response = NextResponse.json({ orderId: order.id, orderNo: order.order_no, paymentUrl: "/odeme/kart" });
  response.cookies.set(CARD_COOKIE, signCardSession({
    sessionId: body.diagnostics?.sessionId && UUID.test(body.diagnostics.sessionId) ? body.diagnostics.sessionId : undefined,
    attemptId: body.diagnostics?.attemptId && UUID.test(body.diagnostics.attemptId) ? body.diagnostics.attemptId : undefined,
    orderId: order.id, orderNo: order.order_no,
    amount: Number(order.grand_total), providerSession: sessionId, expires: Date.now() + 20 * 60 * 1000, isTest,
  }, process.env.TOSLA_API_PASS || ""), {
    httpOnly: true, secure: new URL(request.url).protocol === "https:", sameSite: "lax", path: "/odeme/kart", maxAge: 20 * 60,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
