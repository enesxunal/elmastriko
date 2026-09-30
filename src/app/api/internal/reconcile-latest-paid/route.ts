import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNesInvoiceForOrder } from "@/lib/integrations/nes-order-invoice";

const TOKEN_HASH = "3e5a804b1162fc048a0bdff9ff1791b5bdf34930132374cafe74286d4385779e";

function validToken(value: string) {
  const actual = Buffer.from(createHash("sha256").update(value, "utf8").digest("hex"));
  const expected = Buffer.from(TOKEN_HASH);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-test-token") || "";
  if (!validToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,order_no,status,payment_status,grand_total,created_at")
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message || "Paid order not found" }, { status: 404 });
  }

  let invoice: unknown = null;
  let invoiceError: string | null = null;
  try {
    invoice = await createNesInvoiceForOrder(order.id);
  } catch (error) {
    invoiceError = error instanceof Error ? error.message : "Invoice retry failed";
  }

  const { data: commerce } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "commerce")
    .maybeSingle();

  if (commerce?.value) {
    await supabase
      .from("site_settings")
      .update({
        value: { ...commerce.value, shippingFee: 149 },
        updated_at: new Date().toISOString(),
      })
      .eq("key", "commerce");
  }

  const { data: refreshedOrder } = await supabase
    .from("orders")
    .select("id,order_no,status,payment_status,grand_total,created_at")
    .eq("id", order.id)
    .maybeSingle();

  const { data: latestInvoice } = await supabase
    .from("invoices")
    .select("invoice_no,status,raw_response,created_at")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    order: refreshedOrder || order,
    invoice,
    invoiceError,
    latestInvoice,
    shippingFeeRestored: true,
  });
}
