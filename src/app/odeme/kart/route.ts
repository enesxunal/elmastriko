import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { CARD_COOKIE, readCardSession, cardFormAction } from "@/lib/payments/card-session";
import { renderCardPage } from "@/lib/payments/card-page";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const session = readCardSession(request.cookies.get(CARD_COOKIE)?.value, process.env.TOSLA_API_PASS || "");
  const headers = { "Cache-Control": "no-store, max-age=0", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow" };
  const expired = () => new NextResponse('<!doctype html><html lang="tr"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ödeme oturumu sona erdi | Elmas Triko</title><main><h1>Ödeme oturumu sona erdi.</h1><p>Kart bilgisi girmeden önce siparişinizi yeniden kontrol edin.</p><a href="/checkout">Sipariş bilgilerine dön</a></main></html>', { status: 410, headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
  if (!session) return expired();
  const admin = createAdminClient();
  const [{ data: order }, { data: payment }] = await Promise.all([
    admin.from("orders").select("status,payment_status,grand_total").eq("id", session.orderId).maybeSingle(),
    admin.from("payments").select("raw_response,status").eq("order_id", session.orderId).eq("provider", "tosla").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!order || ["cancelled", "refunded"].includes(order.status) || order.payment_status === "paid" || Number(order.grand_total) !== session.amount ||
    !payment || payment.status !== "pending" || payment.raw_response?.threeDSessionId !== session.providerSession) return expired();
  const nonce = randomBytes(18).toString("base64");
  const action = cardFormAction();
  return new NextResponse(renderCardPage(session, action, nonce), { headers: {
    ...headers, "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": `default-src 'none'; base-uri 'none'; frame-ancestors 'none'; img-src 'self'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; connect-src 'self'; form-action ${new URL(action).origin}`,
  } });
}
