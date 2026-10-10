import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderNotice } from "@/lib/mail";

function normalizedState(status?: string, lastState?: string) {
  return ((lastState || status || "").trim()).toLocaleUpperCase("tr-TR");
}

function mapShipmentStatus(status?: string, lastState?: string) {
  const state = normalizedState(status, lastState);
  if (state.includes("TESLİM EDİLDİ") || state === "DELIVERED" || state === "COMPLETED") return "delivered";
  if (state.includes("DAĞIT") || state.includes("TRANSFER") || state.includes("YÖNLENDİR") || state === "SHIPPED" || state === "OUT_FOR_DELIVERY") return "shipped";
  if (state.includes("HAZIR") || state === "READY_TO_SHIP") return "prepared";
  if (state.includes("İADE") || state === "RETURNING" || state === "RETURNED") return "returned";
  if (state.includes("KAYIP") || state.includes("SORUN") || state.includes("GECİK") || state === "LOST" || state === "NEEDS_SUPPORT" || state === "DELAYED") return "problem";
  return "pending";
}

function mapOrderStatus(status?: string, lastState?: string) {
  const state = normalizedState(status, lastState);
  if (state.includes("TESLİM EDİLDİ") || state === "DELIVERED" || state === "COMPLETED") return "delivered";
  if (state.includes("DAĞIT") || state.includes("TRANSFER") || state.includes("YÖNLENDİR") || state === "SHIPPED" || state === "OUT_FOR_DELIVERY") return "shipped";
  if (state.includes("HAZIR") || state === "READY_TO_SHIP") return "ready_to_ship";
  if (state.includes("İADE") || state === "RETURNING" || state === "RETURNED") return "returned";
  return null;
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.BASITKARGO_WEBHOOK_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const secret = request.nextUrl.searchParams.get("secret");
  if (!secret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const providerReference = String(payload.id || "");
  const barcode = String(payload.barcode || "");
  const shipmentInfo = payload.shipmentInfo && typeof payload.shipmentInfo === "object"
    ? payload.shipmentInfo as Record<string, unknown>
    : null;
  const handlerShipmentCode = String(
    payload.handlerShipmentCode || shipmentInfo?.handlerShipmentCode || "",
  );
  const trackingLink = String(shipmentInfo?.handlerShipmentTrackingLink || "");
  const lastState = String(shipmentInfo?.lastState || "");
  const handler = shipmentInfo?.handler && typeof shipmentInfo.handler === "object"
    ? shipmentInfo.handler as Record<string, unknown>
    : null;
  const handlerCode = String(handler?.code || "").toUpperCase();
  const status = String(payload.status || "");

  if (handlerCode && !handlerCode.includes("SURAT")) {
    return NextResponse.json({ ok: true, ignored: true, reason: "non_surat_handler" }, { status: 202 });
  }

  if (!providerReference && !barcode && !handlerShipmentCode) {
    return NextResponse.json({ error: "Shipment identifier is missing." }, { status: 400 });
  }

  const supabase = createAdminClient();

  let shipmentQuery = supabase
    .from("shipments")
    .select("id,order_id,tracking_code,status")
    .in("provider", ["Sürat Kargo","BasitKargo"]);

  if (providerReference) {
    shipmentQuery = shipmentQuery.eq("provider_reference", providerReference);
  } else {
    shipmentQuery = shipmentQuery.eq("tracking_code", handlerShipmentCode || barcode);
  }

  let { data: shipment } = await shipmentQuery.limit(1).maybeSingle();

  if (!shipment && (handlerShipmentCode || barcode)) {
    const fallback = await supabase
      .from("shipments")
      .select("id,order_id,tracking_code,status")
      .in("provider", ["Sürat Kargo","BasitKargo"])
      .eq("tracking_code", handlerShipmentCode || barcode)
      .limit(1)
      .maybeSingle();
    shipment = fallback.data;
  }

  if (!shipment) {
    return NextResponse.json({ ok: true, ignored: true }, { status: 202 });
  }

  const trackingCode = handlerShipmentCode || barcode || shipment.tracking_code || null;
  const mappedStatus = mapShipmentStatus(status, lastState);

  await supabase
    .from("shipments")
    .update({
      provider: "Sürat Kargo",
      provider_reference: providerReference || null,
      tracking_code: trackingCode,
      tracking_url: trackingLink || null,
      status: mappedStatus,
      raw_response: payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", shipment.id);

  const orderStatus = mapOrderStatus(status, lastState);
  if (orderStatus) {
    await supabase
      .from("orders")
      .update({ status: orderStatus, updated_at: new Date().toISOString() })
      .eq("id", shipment.order_id);
  }

  if (shipment.status !== mappedStatus) {
    try { if(mappedStatus==="delivered") await sendOrderNotice(shipment.order_id,"delivered"); else if(mappedStatus==="shipped") await sendOrderNotice(shipment.order_id,"shipped");  } catch (mailError) { console.error("BasitKargo status mail failed:",mailError); }
  }

  return NextResponse.json({ ok: true });
}
