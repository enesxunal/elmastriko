import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

const FALLBACK_THRESHOLD = 5000;

export async function GET() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "commerce")
    .maybeSingle();

  const value = (data?.value || {}) as Record<string, unknown>;
  const threshold = Number(value.freeShippingThreshold ?? FALLBACK_THRESHOLD);
  const rawFee = value.shippingFee;
  const shippingFee = rawFee === null || rawFee === undefined || rawFee === ""
    ? null
    : Number(rawFee);

  return NextResponse.json({
    currency: String(value.currency || "TRY"),
    freeShippingThreshold: Number.isFinite(threshold) ? threshold : FALLBACK_THRESHOLD,
    shippingFee: shippingFee !== null && Number.isFinite(shippingFee) ? shippingFee : null,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
