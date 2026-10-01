import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { invoiceIntegration } from "@/lib/integrations/invoice";

type InvoiceRaw = {
  uuid?: string;
  documentType?: "einvoice" | "earchive";
  response?: { uuid?: string };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  const admin = createAdminClient();
  const [{ data: profile }, { data: invoice }] = await Promise.all([
    admin.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    admin
      .from("invoices")
      .select("id,order_id,invoice_no,provider,status,raw_response")
      .eq("id", id)
      .maybeSingle(),
  ]);

  if (!invoice) {
    return NextResponse.json({ error: "Fatura bulunamadı." }, { status: 404 });
  }

  const { data: order } = await admin
    .from("orders")
    .select("id,user_id")
    .eq("id", invoice.order_id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin";
  const isOwner = order?.user_id === user.id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Bu faturaya erişim yetkiniz yok." }, { status: 403 });
  }

  const raw = (invoice.raw_response || {}) as InvoiceRaw;
  const uuid = raw.uuid || raw.response?.uuid;
  if (!uuid) {
    return NextResponse.json({ error: "NES belge UUID bilgisi bulunamadı." }, { status: 409 });
  }

  const documentType = raw.documentType === "einvoice" ? "einvoice" : "earchive";

  try {
    const result = documentType === "einvoice"
      ? await invoiceIntegration.getEInvoicePdf(uuid)
      : await invoiceIntegration.getEArchivePdf(uuid);

    const download = request.nextUrl.searchParams.get("download") === "1";
    const filename = (invoice.invoice_no || "fatura") + ".pdf";

    return new Response(result.bytes, {
      status: 200,
      headers: {
        "Content-Type": result.contentType.includes("pdf") ? result.contentType : "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("NES invoice PDF retrieval failed:", error);
    return NextResponse.json(
      { error: "Fatura belgesi NES üzerinden alınamadı." },
      { status: 502 },
    );
  }
}
