import { recordCheckoutEvent } from "@/lib/checkout-diagnostics-server";
import { isBlackFridayActive, blackFridayDiscount } from "@/lib/black-friday";
import { checkoutErrorCode, type CheckoutDiagnosticContext } from "@/lib/checkout-diagnostics";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNewOrderEmails } from "@/lib/mail";
import { saveCheckoutProfile } from "@/lib/checkout-profile";
import { normaliseCheckoutPhone } from "@/lib/checkout-phone";

type OrderPayload = {
  email: string;
  phone?: string;
  saveToProfile?: boolean;
  shipping: {
    fullName: string;
    title?: string;
    city: string;
    district: string;
    postalCode?: string;
    addressLine: string;
  };
  billing?: {
    fullName?: string;
    companyName?: string;
    taxOffice?: string;
    taxNumber?: string;
    city?: string;
    district?: string;
    postalCode?: string;
    addressLine?: string;
  };
  items: Array<{ slug: string; qty: number; size?: string; color?: string }>;
  affiliateCode?: string;
  analytics?: { sessionId?: string; visitorId?: string };
  diagnostics?: CheckoutDiagnosticContext;
};

type OrderResult = {
  status?: string;
  orderId?: string;
  orderNo?: string;
  currency?: string;
  subtotal?: number;
  grandTotal?: number;
  shippingFee?: number;
  [key: string]: unknown;
};

export async function POST(request: NextRequest) {
  let payload: OrderPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (!payload.email || !payload.shipping?.fullName || !payload.shipping?.city || !payload.shipping?.district || !payload.shipping?.addressLine || !payload.items?.length) {
    return NextResponse.json({ error: "Sipariş bilgileri eksik." }, { status: 400 });
  }

  const validatedPhone = normaliseCheckoutPhone(payload.phone || "");
  if (!validatedPhone) return NextResponse.json({ error: "Telefon numarasını 05XX XXX XX XX biçiminde girin." }, { status: 400 });
  payload.phone = validatedPhone;

  // Black Friday replaces all pre-existing discount codes; do not allow direct
  // API callers to stack influencer promotions during the campaign.
  const blackFriday = isBlackFridayActive();
  if (blackFriday) delete payload.affiliateCode;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_store_order", { payload });

  if (error) {
    await recordCheckoutEvent("order_failed", payload.diagnostics, { code: checkoutErrorCode(error.message), isTest: /@example\.invalid$/i.test(payload.email) });
    console.error("Store order creation failed", { code: error.code, category: checkoutErrorCode(error.message) });
    const stockUnavailable = checkoutErrorCode(error.message) === "stock";
    const status = stockUnavailable || error.message.includes("price_missing") ? 409 : 400;
    const message = stockUnavailable
      ? "Sepetinizdeki bir ürünün seçilen renk ve bedeninde yeterli stok kalmadı. Lütfen sepetinizi güncelleyin."
      : error.message;
    return NextResponse.json({ error: message }, { status });
  }

  const result = (data || {}) as OrderResult;
  // The existing DB function creates and reserves the order from trusted
  // catalog prices. Only then apply the limited Black Friday campaign, before
  // the order number or payment initiation is returned to the shopper.
  if (blackFriday) {
    const subtotal = Number(result.subtotal);
    if (!result.orderId || !Number.isFinite(subtotal) || subtotal <= 0) {
      console.error("Black Friday order response is incomplete");
      return NextResponse.json({ error: "İndirimli sipariş tutarı doğrulanamadı. Ödeme başlatılmadı." }, { status: 503 });
    }
    const discountTotal = blackFridayDiscount(subtotal);
    const grandTotal = Math.round((subtotal - discountTotal) * 100) / 100;
    const { data: updated, error: updateError } = await createAdminClient()
      .from("orders").update({
        discount_total: discountTotal, shipping_fee: 0, grand_total: grandTotal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", result.orderId)
      .eq("payment_status", "pending")
      .eq("status", "awaiting_payment")
      .select("id,subtotal,discount_total,shipping_fee,grand_total");
    const stored = updated?.[0];
    if (updateError || updated?.length !== 1 ||
        Math.abs(Number(stored?.subtotal) - subtotal) > 0.001 ||
        Math.abs(Number(stored?.discount_total) - discountTotal) > 0.001 ||
        Number(stored?.shipping_fee) !== 0 ||
        Math.abs(Number(stored?.grand_total) - grandTotal) > 0.001) {
      console.error("Black Friday order pricing could not be verified", updateError?.code);
      return NextResponse.json({ error: "Kampanya tutarı kaydedilemedi. Ödeme başlatılmadı." }, { status: 503 });
    }
    Object.assign(result, { discountTotal, shippingFee: 0, grandTotal });
  }

  if (result.orderId && payload.analytics) {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const { sessionId, visitorId } = payload.analytics;
    if (sessionId && visitorId && uuid.test(sessionId) && uuid.test(visitorId)) {
      try {
        const { error: analyticsError } = await createAdminClient().rpc("attribute_store_order", {
          p_order_id: result.orderId, p_session_id: sessionId, p_visitor_id: visitorId,
        });
        if (analyticsError) console.error("Order analytics attribution unavailable", analyticsError.code);
      } catch { console.error("Order analytics attribution unavailable"); }
    }
  }

  if (result.orderId) {
    // The order is already committed; profile saving must never affect payment.
    try { await saveCheckoutProfile(supabase, { ...payload, phone: validatedPhone }); }
    catch { console.error("Checkout profile save unavailable"); }
    await recordCheckoutEvent("order_created", payload.diagnostics, { orderId: result.orderId, isTest: /@example\.invalid$/i.test(payload.email) });
    try { await sendNewOrderEmails(result.orderId); } catch (mailError) { console.error("New order mail failed:", mailError); }
  }

  return NextResponse.json(result, { status: 201 });
}
