import { createClient } from "@supabase/supabase-js";
import { createNesInvoiceForOrder } from "../src/lib/integrations/nes-order-invoice";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Production Supabase env missing");

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: order, error } = await supabase
    .from("orders")
    .select("id,order_no,status,payment_status,grand_total,created_at")
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !order) throw new Error(error?.message || "No paid order");

  console.log("ORDER", JSON.stringify(order));

  try {
    const invoice = await createNesInvoiceForOrder(order.id);
    console.log("INVOICE", JSON.stringify({
      type: invoice.type,
      uuid: invoice.uuid,
      documentNumber: invoice.documentNumber,
    }));
  } catch (invoiceError) {
    console.log("INVOICE_ERROR", invoiceError instanceof Error ? invoiceError.message : String(invoiceError));
  }

  const { data: commerce } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "commerce")
    .maybeSingle();

  if (commerce?.value) {
    const { error: updateError } = await supabase
      .from("site_settings")
      .update({
        value: { ...commerce.value, shippingFee: 149 },
        updated_at: new Date().toISOString(),
      })
      .eq("key", "commerce");
    if (updateError) throw updateError;
  }

  const { data: invoiceRow } = await supabase
    .from("invoices")
    .select("invoice_no,status,raw_response,created_at")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: finalOrder } = await supabase
    .from("orders")
    .select("order_no,status,payment_status,grand_total")
    .eq("id", order.id)
    .maybeSingle();

  console.log("FINAL_ORDER", JSON.stringify(finalOrder));
  console.log("FINAL_INVOICE", JSON.stringify(invoiceRow && {
    invoice_no: invoiceRow.invoice_no,
    status: invoiceRow.status,
  }));
  console.log("SHIPPING_FEE_RESTORED", 149);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
