import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isToslaConfigured, tosla } from "@/lib/integrations/tosla";

export async function POST(request: NextRequest) {
  if (!isToslaConfigured()) {
    return NextResponse.json({ error: "Tosla credentials are not configured." }, { status: 503 });
  }

  let body: { orderId?: string; email?: string; installmentCount?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
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

  if (order.payment_status === "paid") {
    return NextResponse.json({ error: "Bu sipariş zaten ödendi." }, { status: 409 });
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://elmastriko.com").replace(/\/$/, "");
  const result = await tosla.startHostedThreeD({
    callbackUrl: siteUrl + "/api/payments/tosla/callback",
    orderId: order.order_no,
    amountTry: Number(order.grand_total),
    installmentCount: Math.max(0, Math.min(12, Number(body.installmentCount || 0))),
  });

  const sessionId = String(result.ThreeDSessionId || "");
  if (!sessionId) {
    return NextResponse.json({ error: "Tosla 3D oturumu oluşturulamadı." }, { status: 502 });
  }

  await supabase.from("payments").insert({
    order_id: order.id,
    provider: "tosla",
    provider_reference: sessionId,
    amount: order.grand_total,
    status: "pending",
    raw_response: result,
  });

  await supabase
    .from("orders")
    .update({
      payment_provider: "tosla",
      payment_status: "pending",
      status: "awaiting_payment",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  return NextResponse.json({
    orderId: order.id,
    orderNo: order.order_no,
    threeDSessionId: sessionId,
    formUrl: result.formUrl,
    iframeUrl: result.iframeUrl,
  });
}
