import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNewOrderEmails } from "@/lib/mail";

type OrderPayload = {
  email: string;
  phone?: string;
  shipping: {
    fullName: string;
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

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_store_order", { payload });

  if (error) {
    const status = error.message.includes("price_missing") ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  const result = (data || {}) as OrderResult;
  if (result.orderId && Number.isFinite(Number(result.subtotal))) {
    const admin = createAdminClient();
    const { data: commerce } = await admin
      .from("site_settings")
      .select("value")
      .eq("key", "commerce")
      .maybeSingle();

    const value = (commerce?.value || {}) as Record<string, unknown>;
    const threshold = Number(value.freeShippingThreshold ?? 5000);
    const configuredFee = value.shippingFee === null || value.shippingFee === undefined || value.shippingFee === ""
      ? null
      : Number(value.shippingFee);
    const subtotal = Number(result.subtotal);
    const effectiveShippingFee = subtotal >= threshold
      ? 0
      : configuredFee;

    if (effectiveShippingFee !== null && Number.isFinite(effectiveShippingFee)) {
      const grandTotal = subtotal + effectiveShippingFee;
      if (Number(result.shippingFee) !== effectiveShippingFee || Number(result.grandTotal) !== grandTotal) {
        await admin
          .from("orders")
          .update({
            shipping_fee: effectiveShippingFee,
            grand_total: grandTotal,
            updated_at: new Date().toISOString(),
          })
          .eq("id", result.orderId);

        result.shippingFee = effectiveShippingFee;
        result.grandTotal = grandTotal;
      }
    }
  }

  if (result.orderId) {
    try { await sendNewOrderEmails(result.orderId); } catch (mailError) { console.error("New order mail failed:", mailError); }
  }

  return NextResponse.json(result, { status: 201 });
}
