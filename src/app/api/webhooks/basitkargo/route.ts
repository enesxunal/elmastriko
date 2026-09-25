import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function mapShipmentStatus(status?: string) {
  switch ((status || "").toUpperCase()) {
    case "READY_TO_SHIP": return "prepared";
    case "SHIPPED":
    case "OUT_FOR_DELIVERY": return "shipped";
    case "DELIVERED": return "delivered";
    case "RETURNING":
    case "RETURNED": return "returned";
    case "LOST":
    case "NEEDS_SUPPORT":
    case "DELAYED": return "problem";
    default: return "pending";
  }
}

function mapOrderStatus(status?: string) {
  switch ((status || "").toUpperCase()) {
    case "READY_TO_SHIP": return "ready_to_ship";
    case "SHIPPED":
    case "OUT_FOR_DELIVERY": return "shipped";
    case "DELIVERED": return "delivered";
    case "RETURNING":
    case "RETURNED": return "returned";
    default: return null;
  }
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
  const status = String(payload.status || "");

  if (!providerReference && !barcode && !handlerShipmentCode) {
    return NextResponse.json({ error: "Shipment identifier is missing." }, { status: 400 });
  }

  const supabase = createAdminClient();

  let shipmentQuery = supabase
    .from("shipments")
    .select("id,order_id,tracking_code")
    .eq("provider", "BasitKargo");

  if (providerReference) {
    shipmentQuery = shipmentQuery.eq("provider_reference", providerReference);
  } else {
    shipmentQuery = shipmentQuery.eq("tracking_code", handlerShipmentCode || barcode);
  }

  let { data: shipment } = await shipmentQuery.limit(1).maybeSingle();

  if (!shipment && (handlerShipmentCode || barcode)) {
    const fallback = await supabase
      .from("shipments")
      .select("id,order_id,tracking_code")
      .eq("provider", "BasitKargo")
      .eq("tracking_code", handlerShipmentCode || barcode)
      .limit(1)
      .maybeSingle();
    shipment = fallback.data;
  }

  if (!shipment) {
    return NextResponse.json({ ok: true, ignored: true }, { status: 202 });
  }

  const trackingCode = handlerShipmentCode || barcode || shipment.tracking_code || null;
  const mappedStatus = mapShipmentStatus(status);

  await supabase
    .from("shipments")
    .update({
      provider_reference: providerReference || null,
      tracking_code: trackingCode,
      status: mappedStatus,
      raw_response: payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", shipment.id);

  const orderStatus = mapOrderStatus(status);
  if (orderStatus) {
    await supabase
      .from("orders")
      .update({ status: orderStatus, updated_at: new Date().toISOString() })
      .eq("id", shipment.order_id);
  }

  return NextResponse.json({ ok: true });
}
