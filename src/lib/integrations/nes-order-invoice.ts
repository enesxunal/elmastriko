import { createAdminClient } from "@/lib/supabase/admin";
import { invoiceIntegration, isNesConfigured, type NesDocumentType } from "@/lib/integrations/invoice";
import { buildNesUblInvoice } from "@/lib/integrations/nes-ubl";

type InvoiceResult = {
  type: NesDocumentType;
  uuid: string | null;
  documentNumber: string | null;
  response: Record<string, unknown>;
};

function numericEnv(name: string, fallback: number) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(name + " geçerli bir oran değil.");
  }
  return value;
}

export async function createNesInvoiceForOrder(orderId: string): Promise<InvoiceResult> {
  if (!isNesConfigured()) throw new Error("NES_API_KEY is not configured.");

  const supabase = createAdminClient();
  const [{ data: order, error: orderError }, { data: items, error: itemsError }, { data: addresses, error: addressError }, { data: payment }] = await Promise.all([
    supabase.from("orders").select("id,order_no,guest_email,guest_phone,status,payment_status,subtotal,shipping_fee,discount_total,grand_total,currency,created_at").eq("id", orderId).maybeSingle(),
    supabase.from("order_items").select("id,product_name,sku,unit_price,quantity,line_total").eq("order_id", orderId).order("created_at", { ascending: true }),
    supabase.from("order_addresses").select("kind,full_name,company_name,tax_office,tax_number,phone,city,district,postal_code,address_line").eq("order_id", orderId),
    supabase.from("payments").select("provider,status,created_at").eq("order_id", orderId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (orderError || !order) throw new Error(orderError?.message || "Sipariş bulunamadı.");
  if (itemsError || !items?.length) throw new Error(itemsError?.message || "Sipariş ürünleri bulunamadı.");
  if (addressError || !addresses?.length) throw new Error(addressError?.message || "Fatura adresi bulunamadı.");
  if (order.payment_status !== "paid") throw new Error("Ödeme tamamlanmadan fatura oluşturulamaz.");

  const { data: existing } = await supabase
    .from("invoices")
    .select("id,invoice_no,status,raw_response")
    .eq("order_id", orderId)
    .in("status", ["created", "sent"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const raw = (existing.raw_response || {}) as Record<string, unknown>;
    return {
      type: raw.documentType === "einvoice" ? "einvoice" : "earchive",
      uuid: typeof raw.uuid === "string" ? raw.uuid : null,
      documentNumber: existing.invoice_no || null,
      response: raw,
    };
  }

  const billing = addresses.find(address => address.kind === "billing") || addresses[0];
  const taxNumber = String(billing.tax_number || "").trim();

  let type: NesDocumentType = "earchive";
  let receiverAlias: string | null = null;
  if (taxNumber) {
    const taxpayer = await invoiceIntegration.lookupTaxpayer(taxNumber);
    if (taxpayer.isEInvoiceTaxpayer) {
      type = "einvoice";
      receiverAlias = taxpayer.receiverAlias;
    }
  }

  const now = new Date();
  const { invoiceNumber } = await invoiceIntegration.getDefaultSeries(type, now.getFullYear());
  const uuid = crypto.randomUUID();
  const vatRate = numericEnv("NES_PRODUCT_VAT_RATE", 10);
  const shippingVatRate = numericEnv("NES_SHIPPING_VAT_RATE", vatRate);

  const xml = buildNesUblInvoice({
    invoiceNumber,
    uuid,
    issueDate: now.toISOString().slice(0, 10),
    issueTime: now.toLocaleTimeString("tr-TR", { hour12: false }),
    profileId: type === "einvoice"
      ? ((process.env.NES_EINVOICE_PROFILE_ID === "TICARIFATURA" ? "TICARIFATURA" : "TEMELFATURA"))
      : "EARSIVFATURA",
    currency: order.currency || "TRY",
    orderNo: order.order_no,
    orderDate: new Date(order.created_at).toISOString().slice(0, 10),
    billing: {
      fullName: billing.full_name,
      companyName: billing.company_name,
      taxOffice: billing.tax_office,
      taxNumber: billing.tax_number,
      email: order.guest_email,
      phone: billing.phone || order.guest_phone,
      city: billing.city,
      district: billing.district,
      postalCode: billing.postal_code,
      addressLine: billing.address_line,
    },
    lines: items.map(item => ({
      name: item.product_name,
      sku: item.sku,
      quantity: Number(item.quantity),
      grossUnitPrice: Number(item.unit_price),
    })),
    shippingFee: Number(order.shipping_fee || 0),
    vatRate,
    shippingVatRate,
    websiteUrl: "https://www.elmastriko.com",
    paymentMethod: payment?.provider || "Kart",
  });

  let invoiceRowId: string | null = null;
  const pendingPayload = {
    order_id: orderId,
    provider: "NES Portal",
    invoice_no: invoiceNumber,
    status: "pending",
    raw_response: {
      documentType: type,
      uuid,
      invoiceNumber,
      receiverAlias,
      sourceApp: "ELMAS_TRIKO_WEB",
    },
    updated_at: new Date().toISOString(),
  };

  const { data: invoiceRow, error: insertError } = await supabase
    .from("invoices")
    .insert(pendingPayload)
    .select("id")
    .single();
  if (insertError) throw new Error(insertError.message);
  invoiceRowId = invoiceRow.id;

  try {
    const response = type === "einvoice"
      ? await invoiceIntegration.uploadEInvoice({ xml, orderId: order.order_no, receiverAlias: receiverAlias || undefined, directSend: true })
      : await invoiceIntegration.uploadEArchive({ xml, orderId: order.order_no, directSend: true });

    const responseRecord = response as Record<string, unknown>;
    const responseUuid = typeof response.uuid === "string" ? response.uuid : uuid;
    const responseNumber = typeof response.documentNumber === "string" && response.documentNumber
      ? response.documentNumber
      : invoiceNumber;

    await supabase.from("invoices").update({
      invoice_no: responseNumber,
      status: "sent",
      raw_response: {
        documentType: type,
        uuid: responseUuid,
        invoiceNumber: responseNumber,
        receiverAlias,
        response: responseRecord,
      },
      updated_at: new Date().toISOString(),
    }).eq("id", invoiceRowId);

    await supabase.from("orders").update({
      status: order.status === "paid" ? "invoice_pending" : order.status,
      updated_at: new Date().toISOString(),
    }).eq("id", orderId);

    return {
      type,
      uuid: responseUuid,
      documentNumber: responseNumber,
      response: responseRecord,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "NES faturası oluşturulamadı.";
    if (invoiceRowId) {
      await supabase.from("invoices").update({
        status: "error",
        raw_response: {
          documentType: type,
          uuid,
          invoiceNumber,
          receiverAlias,
          error: message,
        },
        updated_at: new Date().toISOString(),
      }).eq("id", invoiceRowId);
    }
    throw error;
  }
}
