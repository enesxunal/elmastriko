import { NextRequest, NextResponse } from "next/server";
import { CLIENT_CHECKOUT_STAGES, CHECKOUT_ERRORS, CHECKOUT_FIELDS, UUID, type CheckoutStage, type CheckoutError } from "@/lib/checkout-diagnostics";
import { recordCheckoutEvent } from "@/lib/checkout-diagnostics-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin && origin !== `https://${request.headers.get("host")}`) return new NextResponse(null, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json") || Number(request.headers.get("content-length") || 0) > 2048) return new NextResponse(null, { status: 400 });
  try {
    const text = await request.text();
    if (text.length > 2048) return new NextResponse(null, { status: 413 });
    const body = JSON.parse(text);
    if (!CLIENT_CHECKOUT_STAGES.includes(body.stage) || !UUID.test(body.sessionId || "") || !UUID.test(body.attemptId || "")) return new NextResponse(null, { status: 400 });
    if (body.eventId !== undefined && !UUID.test(body.eventId)) return new NextResponse(null, { status: 400 });
    const clientTime = Date.parse(body.at);
    const occurredAt = Number.isFinite(clientTime) && Math.abs(Date.now()-clientTime)<5*60000 ? new Date(clientTime).toISOString() : undefined;
    const admin = createAdminClient();
    const { count, error } = await admin.from("checkout_diagnostics").select("id", { head: true, count: "exact" })
      .eq("session_id", body.sessionId).gte("created_at", new Date(Date.now() - 3600000).toISOString()).abortSignal(AbortSignal.timeout(1500));
    if (error) return new NextResponse(null, { status: 503 });
    if ((count || 0) >= 120) return new NextResponse(null, { status: 429 });
    const saved = await recordCheckoutEvent(body.stage as CheckoutStage, body, {
      eventId: body.eventId, occurredAt, fieldName: CHECKOUT_FIELDS.includes(body.fieldName) ? body.fieldName : undefined,
      code: CHECKOUT_ERRORS.includes(body.code) ? body.code as CheckoutError : undefined,
      fieldGroup: ["contact", "address", "invoice", "card"].includes(body.fieldGroup) ? body.fieldGroup : undefined,
    });
    return new NextResponse(null, { status: saved ? 204 : 503, headers: { "Cache-Control": "no-store" } });
  } catch { return new NextResponse(null, { status: 400 }); }
}
