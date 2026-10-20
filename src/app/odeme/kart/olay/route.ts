import { NextRequest, NextResponse } from "next/server";
import { CARD_COOKIE, readCardSession } from "@/lib/payments/card-session";
import { recordCheckoutEvent } from "@/lib/checkout-diagnostics-server";
import { createAdminClient } from "@/lib/supabase/admin";
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== new URL(request.url).origin && request.headers.get("origin") !== `https://${request.headers.get("host")}`) return new NextResponse(null, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return new NextResponse(null, { status: 400 });
  const session = readCardSession(request.cookies.get(CARD_COOKIE)?.value, process.env.TOSLA_API_PASS || "");
  if (!session) return new NextResponse(null, { status: 401 });
  try {
    const text = await request.text();
    if (text.length > 100) return new NextResponse(null, { status: 413 });
    const { stage } = JSON.parse(text);
    if (stage !== "card_page_viewed" && stage !== "card_form_invalid" && stage !== "card_submitted") return new NextResponse(null, { status: 400 });
    const { count } = await createAdminClient().from("checkout_diagnostics").select("id", { head: true, count: "exact" }).eq("order_id", session.orderId).gte("created_at", new Date(Date.now() - 3600000).toISOString());
    if ((count || 0) < 120) await recordCheckoutEvent(stage, session, { orderId: session.orderId, isTest: session.isTest, ...(stage === "card_form_invalid" ? { code: "validation", fieldGroup: "card" } as const : {}) });
    return new NextResponse(null, { status: 204 });
  } catch { return new NextResponse(null, { status: 400 }); }
}
