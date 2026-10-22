import { recordCheckoutEvent } from "@/lib/checkout-diagnostics-server";
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
  // The database transaction owns shipping, discounts and the final total.
  // Do not overwrite its campaign-aware result with a second calculation.

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
